import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import {
  getOptimizedRoute,
  formatDistance,
  formatDuration,
  RouteStop,
  OptimizedRoute,
} from '../../services/routeService';
import { decode } from '@mapbox/polyline';

const DeliveryMapScreen = () => {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadDeliveryRoute();
  }, []);

  const loadDeliveryRoute = async () => {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show the route');
        setLoading(false);
        return;
      }

      // Get driver's current location
      let driverPos;
      try {
        const location = await Location.getCurrentPositionAsync({});
        driverPos = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (locationError) {
        // Fallback to a default location for simulator/testing
        // Using 117 Justin Ct, Easley, SC 29640
        console.log('Using default location (simulator fallback): 117 Justin Ct, Easley, SC 29640');
        driverPos = {
          latitude: 34.8298,
          longitude: -82.5968,
        };
      }
      setDriverLocation(driverPos);

      // Get all orders ready for delivery or out for delivery
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['ready_for_delivery', 'out_for_delivery']);

      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const optimizedRoute = await getOptimizedRoute(orderIds, driverPos);
        setRoute(optimizedRoute);
      }
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = () => {
    if (!route || route.stops.length === 0) return;

    // Build Google Maps URL with waypoints
    const origin = route.stops[0];
    const destination = route.stops[route.stops.length - 1];
    const waypoints = route.stops
      .slice(1, -1)
      .map(stop => `${stop.location.latitude},${stop.location.longitude}`)
      .join('|');

    const url = Platform.select({
      ios: `comgooglemaps://?saddr=${origin.location.latitude},${origin.location.longitude}&daddr=${destination.location.latitude},${destination.location.longitude}${waypoints ? `&waypoints=${waypoints}` : ''}&directionsmode=driving`,
      android: `google.navigation:q=${destination.location.latitude},${destination.location.longitude}${waypoints ? `&waypoints=${waypoints}` : ''}`,
    });

    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.location.latitude},${origin.location.longitude}&destination=${destination.location.latitude},${destination.location.longitude}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

    // Try to open Google Maps app, fallback to web
    Linking.canOpenURL(url!).then(supported => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        Linking.openURL(fallbackUrl);
      }
    }).catch(() => {
      Linking.openURL(fallbackUrl);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34A853" />
        <Text style={styles.loadingText}>Optimizing route...</Text>
      </View>
    );
  }

  if (!route || route.stops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="map-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Active Deliveries</Text>
        <Text style={styles.emptyText}>
          Orders ready for delivery will appear here with an optimized route
        </Text>
      </View>
    );
  }

  // Calculate map region to fit all markers
  const latitudes = route.stops.map(s => s.location.latitude);
  const longitudes = route.stops.map(s => s.location.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.5,
    longitudeDelta: (maxLng - minLng) * 1.5,
  };

  // Decode polyline for route path
  const routeCoordinates = route.polyline
    ? decode(route.polyline).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }))
    : [];

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#34A853"
            strokeWidth={4}
          />
        )}

        {/* Markers for each stop */}
        {route.stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={stop.location}
            onPress={() => setSelectedStop(stop)}
          >
            <View
              style={[
                styles.markerContainer,
                stop.type === 'pickup'
                  ? styles.pickupMarker
                  : styles.deliveryMarker,
              ]}
            >
              <Ionicons
                name={stop.type === 'pickup' ? 'storefront' : 'home'}
                size={20}
                color="#fff"
              />
              <Text style={styles.markerNumber}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Route summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="navigate" size={20} color="#34A853" />
            <Text style={styles.summaryValue}>{formatDistance(route.totalDistance)}</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={20} color="#34A853" />
            <Text style={styles.summaryValue}>{formatDuration(route.totalDuration)}</Text>
            <Text style={styles.summaryLabel}>Duration</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="location" size={20} color="#34A853" />
            <Text style={styles.summaryValue}>{route.stops.length}</Text>
            <Text style={styles.summaryLabel}>Stops</Text>
          </View>
        </View>
        
        {/* Start Route Button */}
        <TouchableOpacity style={styles.startButton} onPress={startNavigation}>
          <Ionicons name="navigate-circle" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Start Route in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Stop details bottom sheet */}
      {selectedStop && (
        <View style={styles.bottomSheet}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedStop(null)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.stopHeader}>
            <View
              style={[
                styles.stopBadge,
                selectedStop.type === 'pickup'
                  ? styles.pickupBadge
                  : styles.deliveryBadge,
              ]}
            >
              <Ionicons
                name={selectedStop.type === 'pickup' ? 'storefront' : 'home'}
                size={16}
                color="#fff"
              />
              <Text style={styles.stopBadgeText}>
                {selectedStop.type === 'pickup' ? 'Pickup' : 'Delivery'}
              </Text>
            </View>
          </View>
          {selectedStop.sellerName && (
            <Text style={styles.stopTitle}>{selectedStop.sellerName}</Text>
          )}
          <Text style={styles.stopAddress}>{selectedStop.address}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  pickupMarker: {
    backgroundColor: '#FF9800',
  },
  deliveryMarker: {
    backgroundColor: '#34A853',
  },
  markerNumber: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34A853',
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  stopHeader: {
    marginBottom: 12,
  },
  stopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pickupBadge: {
    backgroundColor: '#FF9800',
  },
  deliveryBadge: {
    backgroundColor: '#34A853',
  },
  stopBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stopTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stopAddress: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default DeliveryMapScreen;
