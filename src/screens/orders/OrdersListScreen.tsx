import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../types/database';
import { LoadingSpinner } from '../../components';

type Order = Database['public']['Tables']['orders']['Row'];

type OrdersListScreenProps = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrdersList'>;
};

const OrdersListScreen: React.FC<OrdersListScreenProps> = ({ navigation }) => {
  const { user, isRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMasterAdmin = isRole(['master']);
  const isSeller = isRole(['seller']);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Refetch orders when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchOrders = async () => {
    try {
      // Master admins see all orders
      if (isMasterAdmin) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
      // Sellers see orders containing their products
      else if (isSeller) {
        // Get seller ID
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        console.log('Seller data:', sellerData);
        console.log('Seller error:', sellerError);

        if (!sellerData) {
          console.log('No seller data found');
          setOrders([]);
          setLoading(false);
          return;
        }

        console.log('Fetching orders for seller:', sellerData.id);

        // First, let's check what products this seller has
        const { data: sellerProducts } = await supabase
          .from('products')
          .select('id, name, seller_id')
          .eq('seller_id', sellerData.id);
        
        console.log('Seller products:', sellerProducts);

        // Check all order items to see what's there (no join)
        const { data: allOrderItems } = await supabase
          .from('order_items')
          .select('*');
        
        console.log('All order items (no join):', allOrderItems);

        // Get order IDs that contain this seller's products
        // Use the view instead which already has the join
        const { data: orderItemsData } = await supabase
          .from('order_items_with_seller')
          .select('order_id, seller_id')
          .eq('seller_id', sellerData.id);

        console.log('Order items for seller (from view):', orderItemsData);

        if (!orderItemsData || orderItemsData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Get unique order IDs
        const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
        console.log('Order IDs:', orderIds);

        // Fetch the actual orders
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        console.log('Orders query result:', { data, error });
        console.log('Number of orders found:', data?.length);

        if (error) {
          console.error('Error fetching seller orders:', error);
          throw error;
        }
        
        setOrders(data || []);
      }
      // Regular customers see their own orders
      else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      {isMasterAdmin && (
        <View style={styles.adminBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.adminBannerText}>Viewing All Platform Orders</Text>
        </View>
      )}
      {isSeller && !isMasterAdmin && (
        <View style={styles.sellerBanner}>
          <Ionicons name="storefront" size={20} color="#2196F3" />
          <Text style={styles.sellerBannerText}>Orders Containing Your Products</Text>
        </View>
      )}
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders</Text>
            <Text style={styles.emptyText}>
              {isMasterAdmin
                ? 'No orders have been placed yet'
                : 'You haven\'t placed any orders yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <Text style={styles.orderDate}>{formatDate(item.created_at!)}</Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Delivery:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="cube-outline" size={16} color="#666" />
                <Text style={styles.detailText}>Items in order</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.detailText}>${item.total.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name={item.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                  size={16}
                  color={item.payment_status === 'paid' ? '#4CAF50' : '#FF9800'}
                />
                <Text style={styles.detailText}>
                  {item.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.viewDetails}>View Details</Text>
              <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF50',
  },
  adminBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sellerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
  },
  sellerBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
});

export default OrdersListScreen;
