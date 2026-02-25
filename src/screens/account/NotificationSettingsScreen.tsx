import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components';

type NotificationSettingsScreenProps = NativeStackScreenProps<
  AccountStackParamList,
  'NotificationSettings'
>;

interface NotificationPreferences {
  new_order: boolean;
  order_status_update: boolean;
  order_delivered: boolean;
  order_cancelled: boolean;
  refund_processed: boolean;
  product_sold: boolean;
  low_stock_alert: boolean;
  delivery_assigned: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = () => {
  const { user, isRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    new_order: true,
    order_status_update: true,
    order_delivered: true,
    order_cancelled: true,
    refund_processed: true,
    product_sold: true,
    low_stock_alert: true,
    delivery_assigned: true,
    push_enabled: true,
    email_enabled: false,
  });

  const isSeller = isRole(['seller']);
  const isDriver = isRole(['driver']);
  const isCustomer = !isRole(['seller', 'driver', 'admin', 'master']);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: user.id,
            [key]: value,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      setPreferences(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading preferences..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Push Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Method</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications on your device
            </Text>
          </View>
          <Switch
            value={preferences.push_enabled}
            onValueChange={(value) => updatePreference('push_enabled', value)}
            trackColor={{ false: '#ccc', true: '#34A853' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Email Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications via email (coming soon)
            </Text>
          </View>
          <Switch
            value={preferences.email_enabled}
            onValueChange={(value) => updatePreference('email_enabled', value)}
            trackColor={{ false: '#ccc', true: '#34A853' }}
            disabled
          />
        </View>
      </View>

      {/* Customer Notifications */}
      {isCustomer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Order Status Updates</Text>
              <Text style={styles.settingDescription}>
                When your order status changes
              </Text>
            </View>
            <Switch
              value={preferences.order_status_update}
              onValueChange={(value) => updatePreference('order_status_update', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Order Delivered</Text>
              <Text style={styles.settingDescription}>
                When your order is delivered
              </Text>
            </View>
            <Switch
              value={preferences.order_delivered}
              onValueChange={(value) => updatePreference('order_delivered', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Order Cancelled</Text>
              <Text style={styles.settingDescription}>
                When your order is cancelled
              </Text>
            </View>
            <Switch
              value={preferences.order_cancelled}
              onValueChange={(value) => updatePreference('order_cancelled', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Refund Processed</Text>
              <Text style={styles.settingDescription}>
                When a refund is processed
              </Text>
            </View>
            <Switch
              value={preferences.refund_processed}
              onValueChange={(value) => updatePreference('refund_processed', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>
        </View>
      )}

      {/* Seller Notifications */}
      {isSeller && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>New Orders</Text>
              <Text style={styles.settingDescription}>
                When you receive a new order
              </Text>
            </View>
            <Switch
              value={preferences.new_order}
              onValueChange={(value) => updatePreference('new_order', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Product Sold</Text>
              <Text style={styles.settingDescription}>
                When your product is purchased
              </Text>
            </View>
            <Switch
              value={preferences.product_sold}
              onValueChange={(value) => updatePreference('product_sold', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Low Stock Alerts</Text>
              <Text style={styles.settingDescription}>
                When product stock is running low
              </Text>
            </View>
            <Switch
              value={preferences.low_stock_alert}
              onValueChange={(value) => updatePreference('low_stock_alert', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>
        </View>
      )}

      {/* Driver Notifications */}
      {isDriver && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Delivery Assigned</Text>
              <Text style={styles.settingDescription}>
                When a delivery is assigned to you
              </Text>
            </View>
            <Switch
              value={preferences.delivery_assigned}
              onValueChange={(value) => updatePreference('delivery_assigned', value)}
              trackColor={{ false: '#ccc', true: '#34A853' }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default NotificationSettingsScreen;
