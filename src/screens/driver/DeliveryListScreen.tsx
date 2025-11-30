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
import { DriverStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Map, Package, Calendar, DollarSign, ChevronRight } from 'lucide-react-native';
import { LoadingSpinner } from '../../components';
import { Database } from '../../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

type DeliveryListScreenProps = {
  navigation: NativeStackNavigationProp<DriverStackParamList, 'DeliveryList'>;
};

const DeliveryListScreen: React.FC<DeliveryListScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Refetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchOrders = async () => {
    try {
      // Fetch orders that are ready for delivery or already out for delivery
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['ready_for_delivery', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
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
    return status === 'ready_for_delivery' ? '#4CAF50' : '#00BCD4';
  };

  const getStatusLabel = (status: string) => {
    return status === 'ready_for_delivery' ? 'Ready for Pickup' : 'In Transit';
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone conversion issues
    // Handle both date-only (YYYY-MM-DD) and datetime (ISO 8601) formats
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading deliveries..." />;
  }

  return (
    <View style={styles.container}>
      {/* View Map Button */}
      {orders.length > 0 && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('DeliveryMap')}
        >
          <Map size={20} color="#fff" />
          <Text style={styles.mapButtonText}>View Route Map</Text>
        </TouchableOpacity>
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
            <Package size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Deliveries</Text>
            <Text style={styles.emptyText}>
              Orders ready for delivery will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.id })}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <Text style={styles.orderDate}>{formatDate(item.created_at!)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Calendar size={16} color="#666" />
                <Text style={styles.detailText}>
                  Delivery: {item.delivery_date ? formatDate(item.delivery_date) : 'TBD'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <DollarSign size={16} color="#666" />
                <Text style={styles.detailText}>${item.total.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.viewDetails}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <ChevronRight size={20} color="#4CAF50" />
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
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
    elevation: 3,
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
    fontWeight: 'bold',
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
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
});

export default DeliveryListScreen;
