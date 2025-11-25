import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components';
import { Database } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

type Order = Database['public']['Tables']['orders']['Row'] & {
  delivery_address?: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    delivery_instructions?: string | null;
  };
};
type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    seller?: {
      business_name: string;
      business_address?: string;
      business_phone?: string;
    };
  };
};

type OrderDetailScreenProps = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route: RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ route }) => {
  const { orderId } = route.params;
  const { isRole } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isSeller = isRole(['seller']);
  const isDriver = isRole(['driver']);
  const isAdmin = isRole(['admin', 'master']);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order with delivery address
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_address:addresses(
            street_address,
            city,
            state,
            zip_code,
            delivery_instructions
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData as any);

      // Fetch order items with products and seller info
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            id,
            name,
            image_url,
            seller:sellers(
              business_name,
              business_address,
              business_phone
            )
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData as any || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      preparing: '#9C27B0',
      ready_for_delivery: '#4CAF50',
      out_for_delivery: '#00BCD4',
      delivered: '#4CAF50',
      cancelled: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    Alert.alert(
      'Update Order Status',
      `Mark this order as ${newStatus.replace(/_/g, ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

              if (error) throw error;

              // Refresh order details
              await fetchOrderDetails();
              Alert.alert('Success', 'Order status updated successfully');
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update order status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const canUpdateStatus = () => {
    if (!order) return false;
    if (isAdmin) return true;
    if (isSeller && order.status === 'pending') return true;
    if (isDriver && (order.status === 'ready_for_delivery' || order.status === 'out_for_delivery')) return true;
    return false;
  };

  const getNextStatus = () => {
    if (!order) return null;
    if (isSeller && order.status === 'pending') return 'ready_for_delivery';
    if (isDriver && order.status === 'ready_for_delivery') return 'out_for_delivery';
    if (isDriver && order.status === 'out_for_delivery') return 'delivered';
    return null;
  };

  const getNextStatusLabel = () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return '';
    return nextStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <LoadingSpinner message="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      {/* Delivery Info */}
      {order.delivery_date && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Delivery Information</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.delivery_date)}</Text>
            </View>
            {order.special_instructions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Special Instructions</Text>
                <Text style={styles.infoValue}>{order.special_instructions}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Pickup Locations (for drivers and admins) */}
      {(isDriver || isAdmin) && orderItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront-outline" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Pickup Locations</Text>
          </View>
          {Array.from(new Set(orderItems.map(item => item.product.seller?.business_name).filter(Boolean))).map((businessName) => {
            const sellerItems = orderItems.filter(item => item.product.seller?.business_name === businessName);
            const seller = sellerItems[0]?.product.seller;
            if (!seller) return null;
            
            return (
              <View key={businessName} style={styles.pickupCard}>
                <Text style={styles.sellerName}>{seller.business_name}</Text>
                {seller.business_address && (
                  <View style={styles.pickupRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.pickupText}>{seller.business_address}</Text>
                  </View>
                )}
                {seller.business_phone && (
                  <View style={styles.pickupRow}>
                    <Ionicons name="call" size={16} color="#666" />
                    <Text style={styles.pickupText}>{seller.business_phone}</Text>
                  </View>
                )}
                <View style={styles.pickupRow}>
                  <Ionicons name="cube" size={16} color="#666" />
                  <Text style={styles.pickupText}>
                    {sellerItems.length} item{sellerItems.length > 1 ? 's' : ''} to pick up
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Delivery Address (for drivers and admins) */}
      {(isDriver || isAdmin) && order.delivery_address && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.addressText}>
                {order.delivery_address.street_address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.addressText}>
                {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}
              </Text>
            </View>
            {order.delivery_address.delivery_instructions && (
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={styles.infoLabel}>Delivery Instructions</Text>
                <Text style={styles.infoValue}>
                  {order.delivery_address.delivery_instructions}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={20} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Items ({orderItems.length})</Text>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.product.image_url ? (
              <Image
                source={{ uri: item.product.image_url }}
                style={styles.itemImage}
              />
            ) : (
              <View style={[styles.itemImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={30} color="#999" />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemDetails}>
                ${item.unit_price.toFixed(2)} × {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>${item.total_price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={20} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${(order.delivery_fee || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${(order.tax || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name={order.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
            size={20}
            color={order.payment_status === 'paid' ? '#4CAF50' : '#FF9800'}
          />
          <Text style={styles.sectionTitle}>Payment Status</Text>
        </View>
        <View style={styles.infoCard}>
          <Text
            style={[
              styles.paymentStatus,
              {
                color: order.payment_status === 'paid' ? '#4CAF50' : '#FF9800',
              },
            ]}
          >
            {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
          </Text>
        </View>
      </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Update Status Button (for sellers and drivers) - Fixed at bottom */}
      {canUpdateStatus() && getNextStatus() && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={() => updateOrderStatus(getNextStatus()!)}
            disabled={updating}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>
              {updating ? 'Updating...' : `Mark as ${getNextStatusLabel()}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  fixedButtonContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentStatus: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pickupCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default OrderDetailScreen;
