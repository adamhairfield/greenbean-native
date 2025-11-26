import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components';

interface AnalyticsData {
  totalSales: number;
  platformProfit: number;
  totalDeliveryFees: number;
  totalOrders: number;
  activeUsers: number;
  activeSellers: number;
  activeDrivers: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  totalProducts: number;
}

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSales: 0,
    platformProfit: 0,
    totalDeliveryFees: 0,
    totalOrders: 0,
    activeUsers: 0,
    activeSellers: 0,
    activeDrivers: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
  });
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      
      if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Fetch orders data
      let ordersQuery = supabase
        .from('orders')
        .select('total, status, delivery_fee, created_at')
        .neq('status', 'cancelled');

      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Calculate sales and profit
      const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalDeliveryFees = orders?.reduce((sum, order) => sum + (order.delivery_fee || 0), 0) || 0;
      const platformProfit = (totalSales * 0.10) + totalDeliveryFees; // 10% commission + delivery fees
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Fetch user counts (customers only)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('role');

      console.log('All profiles:', allProfiles);

      const customers = allProfiles?.filter(p => p.role === 'customer') || [];
      const drivers = allProfiles?.filter(p => p.role === 'driver') || [];

      const { count: sellerCount } = await supabase
        .from('sellers')
        .select('*', { count: 'exact', head: true });

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      setAnalytics({
        totalSales,
        platformProfit,
        totalDeliveryFees,
        totalOrders,
        activeUsers: customers?.length || 0,
        activeSellers: sellerCount || 0,
        activeDrivers: drivers?.length || 0,
        averageOrderValue,
        completedOrders,
        pendingOrders,
        totalProducts: productCount || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'all' && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange('all')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'all' && styles.timeRangeTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Revenue Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.primaryCard]}>
            <Ionicons name="cash" size={32} color="#fff" />
            <Text style={styles.metricValue}>${analytics.totalSales.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Total Sales</Text>
          </View>
          <View style={[styles.metricCard, styles.successCard]}>
            <Ionicons name="trending-up" size={32} color="#fff" />
            <Text style={styles.metricValue}>${analytics.platformProfit.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Platform Profit</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="car" size={24} color="#FF9800" />
            <Text style={styles.metricValueSecondary}>${analytics.totalDeliveryFees.toFixed(2)}</Text>
            <Text style={styles.metricLabelSecondary}>Total Delivery Fees</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="cart" size={24} color="#4CAF50" />
            <Text style={styles.metricValueSecondary}>${analytics.averageOrderValue.toFixed(2)}</Text>
            <Text style={styles.metricLabelSecondary}>Avg Order Value</Text>
          </View>
        </View>
      </View>

      {/* Orders Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="receipt" size={24} color="#2196F3" />
            <Text style={styles.metricValueSecondary}>{analytics.totalOrders}</Text>
            <Text style={styles.metricLabelSecondary}>Total Orders</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.metricValueSecondary}>{analytics.completedOrders}</Text>
            <Text style={styles.metricLabelSecondary}>Completed</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time" size={24} color="#FF9800" />
            <Text style={styles.metricValueSecondary}>{analytics.pendingOrders}</Text>
            <Text style={styles.metricLabelSecondary}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Platform Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="people" size={24} color="#9C27B0" />
            <Text style={styles.metricValueSecondary}>{analytics.activeUsers}</Text>
            <Text style={styles.metricLabelSecondary}>Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="storefront" size={24} color="#FF5722" />
            <Text style={styles.metricValueSecondary}>{analytics.activeSellers}</Text>
            <Text style={styles.metricLabelSecondary}>Sellers</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="car" size={24} color="#00BCD4" />
            <Text style={styles.metricValueSecondary}>{analytics.activeDrivers}</Text>
            <Text style={styles.metricLabelSecondary}>Drivers</Text>
          </View>
        </View>
        <View style={styles.metricCard}>
          <Ionicons name="cube" size={24} color="#4CAF50" />
          <Text style={styles.metricValueSecondary}>{analytics.totalProducts}</Text>
          <Text style={styles.metricLabelSecondary}>Total Products</Text>
        </View>
      </View>

      {/* Key Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <View style={styles.insightCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.insightText}>
            Platform profit represents delivery fees collected
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.insightText}>
            Completion rate: {analytics.totalOrders > 0 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: '#4CAF50',
  },
  successCard: {
    backgroundColor: '#2196F3',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  metricValueSecondary: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabelSecondary: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
  },
});

export default AnalyticsScreen;
