import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OrdersStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Truck, ShieldCheck, Store, Receipt, Package, DollarSign, CheckCircle, Clock, ChevronRight, Search, X } from 'lucide-react-native';
import { Database } from '../../types/database';
import { LoadingSpinner } from '../../components';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items?: { quantity: number; product_name?: string; seller_name?: string }[];
};

type OrdersListScreenProps = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrdersList'>;
};

const OrdersListScreen: React.FC<OrdersListScreenProps> = ({ navigation }) => {
  const { user, isRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isMasterAdmin = isRole(['master']);
  const isSeller = isRole(['seller']);
  const isDriver = isRole(['driver']);

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
      // Master admins and drivers see all orders
      if (isMasterAdmin || isDriver) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              quantity,
              products(name, sellers(business_name))
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Flatten product and seller names for search
        const ordersWithDetails = (data || []).map(order => ({
          ...order,
          order_items: order.order_items?.map((item: any) => ({
            quantity: item.quantity,
            product_name: item.products?.name,
            seller_name: item.products?.sellers?.business_name,
          })),
        }));
        
        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
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

        // Fetch the actual orders with order_items
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              quantity,
              products(name, sellers(business_name))
            )
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        console.log('Orders query result:', { data, error });
        console.log('Number of orders found:', data?.length);

        if (error) {
          console.error('Error fetching seller orders:', error);
          throw error;
        }
        
        // Flatten product and seller names for search
        const ordersWithDetails = (data || []).map(order => ({
          ...order,
          order_items: order.order_items?.map((item: any) => ({
            quantity: item.quantity,
            product_name: item.products?.name,
            seller_name: item.products?.sellers?.business_name,
          })),
        }));
        
        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
      }
      // Regular customers see their own orders
      else {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              quantity,
              products(name, sellers(business_name))
            )
          `)
          .eq('customer_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Flatten product and seller names for search
        const ordersWithDetails = (data || []).map(order => ({
          ...order,
          order_items: order.order_items?.map((item: any) => ({
            quantity: item.quantity,
            product_name: item.products?.name,
            seller_name: item.products?.sellers?.business_name,
          })),
        }));
        
        setOrders(ordersWithDetails);
        setFilteredOrders(ordersWithDetails);
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

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order => {
      // Search by order number
      if (order.order_number?.toLowerCase().includes(query)) {
        return true;
      }

      // Search by product names
      const hasMatchingProduct = order.order_items?.some(item => 
        item.product_name?.toLowerCase().includes(query)
      );
      if (hasMatchingProduct) return true;

      // Search by seller names
      const hasMatchingSeller = order.order_items?.some(item => 
        item.seller_name?.toLowerCase().includes(query)
      );
      if (hasMatchingSeller) return true;

      // Search by status
      if (getStatusLabel(order.status).toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });

    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      preparing: '#9C27B0',
      ready_for_delivery: '#34A853',
      out_for_delivery: '#00BCD4',
      delivered: '#34A853',
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search orders, products, sellers..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <X size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          </Text>
        </View>
      )}

      {(isMasterAdmin || isDriver) && (
        <View style={styles.adminBanner}>
          <ShieldCheck size={20} color="#34A853" />
          <Text style={styles.adminBannerText}>
            {isDriver ? 'Viewing All Orders for Delivery' : 'Viewing All Platform Orders'}
          </Text>
        </View>
      )}
      {isSeller && !isMasterAdmin && (
        <View style={styles.sellerBanner}>
          <Store size={20} color="#2196F3" />
          <Text style={styles.sellerBannerText}>Orders Containing Your Products</Text>
        </View>
      )}
      
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Orders Found' : 'No Orders'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : isMasterAdmin
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
                <Truck 
                  size={20} 
                  color={getStatusColor(item.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Package size={16} color="#666" />
                <Text style={styles.detailText}>
                  {(() => {
                    const totalQty = item.order_items?.reduce((sum: number, oi: any) => sum + (oi.quantity || 0), 0) || 0;
                    return `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
                  })()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <DollarSign size={16} color="#666" />
                <Text style={styles.detailText}>${item.total.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                {item.payment_status === 'paid' ? (
                  <CheckCircle size={16} color="#34A853" />
                ) : (
                  <Clock size={16} color="#FF9800" />
                )}
                <Text style={styles.detailText}>
                  {item.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.viewDetails}>View Details</Text>
              <ChevronRight size={20} color="#34A853" />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsBar: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#34A853',
  },
  adminBannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
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
    gap: 6,
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
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    color: '#34A853',
    marginRight: 4,
  },
});

export default OrdersListScreen;
