import { supabase } from '../lib/supabase';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface RouteStop {
  id: string;
  type: 'pickup' | 'delivery';
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  orderId?: string;
  sellerName?: string;
  itemCount?: number;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number; // in meters
  totalDuration: number; // in seconds
  polyline: string;
}

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Get optimized route using Google Maps Directions API
export const getOptimizedRoute = async (
  orderIds: string[],
  driverLocation?: { latitude: number; longitude: number }
): Promise<OptimizedRoute | null> => {
  try {
    const stops: RouteStop[] = [];
    
    // Add driver's starting location if provided
    if (driverLocation) {
      stops.push({
        id: 'driver-start',
        type: 'pickup',
        address: 'Your Location',
        location: driverLocation,
      });
    }
    
    // Collect all pickup and delivery locations
    for (const orderId of orderIds) {
      // Get delivery address
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_address_id,
          addresses!delivery_address_id(
            street_address,
            city,
            state,
            zip_code
          )
        `)
        .eq('id', orderId)
        .single();

      const deliveryAddress = order?.addresses as any;
      if (deliveryAddress) {
        const address = `${deliveryAddress.street_address}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zip_code}`;
        const coords = await geocodeAddress(address);
        
        if (coords) {
          stops.push({
            id: `delivery-${order.id}`,
            type: 'delivery',
            address,
            location: coords,
            orderId: order.id,
          });
        }
      }

      // Get pickup locations
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          product:products(
            seller:sellers(
              id,
              business_name,
              business_address
            )
          )
        `)
        .eq('order_id', orderId);

      // Get unique sellers
      const sellersMap = new Map();
      items?.forEach((item: any) => {
        const seller = item.product?.seller;
        if (seller && seller.business_address && !sellersMap.has(seller.id)) {
          sellersMap.set(seller.id, seller);
        }
      });

      for (const seller of sellersMap.values()) {
        const coords = await geocodeAddress(seller.business_address);
        if (coords) {
          stops.push({
            id: `pickup-${seller.id}`,
            type: 'pickup',
            address: seller.business_address,
            location: coords,
            sellerName: seller.business_name,
          });
        }
      }
    }

    if (stops.length === 0) {
      return null;
    }

    // Separate pickups and deliveries
    const pickups = stops.filter(s => s.type === 'pickup');
    const deliveries = stops.filter(s => s.type === 'delivery');

    // Need at least one delivery to create a route
    if (deliveries.length === 0) {
      return null;
    }

    // If no pickups, just use deliveries
    if (pickups.length === 0) {
      // Use driver location or first delivery as origin
      const origin = driverLocation 
        ? { id: 'driver-start', type: 'pickup' as const, address: 'Your Location', location: driverLocation }
        : deliveries[0];
      const destination = deliveries[deliveries.length - 1];
      const waypoints = deliveries.slice(1, -1).map(stop => `${stop.location.latitude},${stop.location.longitude}`).join('|');

      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.location.latitude},${origin.location.longitude}&destination=${destination.location.latitude},${destination.location.longitude}${waypoints ? `&waypoints=optimize:true|${waypoints}` : ''}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        const optimizedStops = [origin];
        if (data.routes[0].waypoint_order && waypoints) {
          const allWaypoints = deliveries.slice(1, -1);
          data.routes[0].waypoint_order.forEach((index: number) => {
            optimizedStops.push(allWaypoints[index]);
          });
        } else if (deliveries.length > 2) {
          optimizedStops.push(...deliveries.slice(1, -1));
        }
        optimizedStops.push(destination);

        return {
          stops: optimizedStops,
          totalDistance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
          totalDuration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
          polyline: route.overview_polyline.points,
        };
      }
      return null;
    }

    // Build waypoints string for Google Directions API
    // Format: pickup1|pickup2|...pickupN|delivery1|delivery2|...deliveryN
    const origin = pickups[0];
    const destination = deliveries[deliveries.length - 1];
    
    const waypoints = [
      ...pickups.slice(1),
      ...deliveries.slice(0, -1)
    ].map(stop => `${stop.location.latitude},${stop.location.longitude}`).join('|');

    // Call Google Directions API with waypoint optimization
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.location.latitude},${origin.location.longitude}&destination=${destination.location.latitude},${destination.location.longitude}${waypoints ? `&waypoints=optimize:true|${waypoints}` : ''}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      // Reorder stops based on optimized waypoint order
      const optimizedStops = [origin];
      if (data.routes[0].waypoint_order) {
        const allWaypoints = [...pickups.slice(1), ...deliveries.slice(0, -1)];
        data.routes[0].waypoint_order.forEach((index: number) => {
          optimizedStops.push(allWaypoints[index]);
        });
      }
      optimizedStops.push(destination);

      return {
        stops: optimizedStops,
        totalDistance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
        totalDuration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
        polyline: route.overview_polyline.points,
      };
    }

    return null;
  } catch (error) {
    console.error('Route optimization error:', error);
    return null;
  }
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} mi`;
};

// Format duration for display
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};
