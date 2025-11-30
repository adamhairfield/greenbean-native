import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Card, LoadingSpinner } from '../../components';

type Seller = {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  business_address: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_completed: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
};

type ManageSellersScreenProps = NativeStackScreenProps<
  AdminStackParamList,
  'ManageSellers'
>;

const ManageSellersScreen: React.FC<ManageSellersScreenProps> = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      Alert.alert('Error', 'Failed to load sellers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellers();
  };

  const handleApproveSeller = async (seller: Seller) => {
    Alert.alert(
      'Approve Seller',
      `Approve ${seller.business_name}? They will be able to start selling.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sellers')
                .update({ is_verified: true, is_active: true })
                .eq('id', seller.id);

              if (error) throw error;

              Alert.alert('Success', 'Seller approved successfully');
              fetchSellers();
            } catch (error: any) {
              console.error('Error approving seller:', error);
              Alert.alert('Error', error.message || 'Failed to approve seller');
            }
          },
        },
      ]
    );
  };

  const handleRejectSeller = async (seller: Seller) => {
    Alert.alert(
      'Reject Seller',
      `Reject ${seller.business_name}? They will be deactivated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sellers')
                .update({ is_verified: false, is_active: false })
                .eq('id', seller.id);

              if (error) throw error;

              Alert.alert('Success', 'Seller rejected');
              fetchSellers();
            } catch (error: any) {
              console.error('Error rejecting seller:', error);
              Alert.alert('Error', error.message || 'Failed to reject seller');
            }
          },
        },
      ]
    );
  };

  const renderSeller = ({ item }: { item: Seller }) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    
    return (
      <Card style={styles.sellerCard}>
        <View style={styles.sellerHeader}>
          <View style={styles.sellerInfo}>
            <Text style={styles.businessName}>{item.business_name}</Text>
            <Text style={styles.ownerName}>{profile?.full_name || 'Unknown'}</Text>
            <Text style={styles.email}>{item.business_email}</Text>
          </View>
          <View style={styles.statusBadges}>
            {item.is_verified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons name="checkmark-circle" size={16} color="#7FAC4E" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {!item.is_verified && item.stripe_onboarding_completed && (
              <View style={[styles.badge, styles.pendingBadge]}>
                <Ionicons name="time-outline" size={16} color="#FF9800" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
            {!item.is_active && (
              <View style={[styles.badge, styles.inactiveBadge]}>
                <Ionicons name="close-circle" size={16} color="#f44336" />
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.business_address || 'No address provided'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.business_phone || 'No phone provided'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons 
              name={item.stripe_onboarding_completed ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={item.stripe_onboarding_completed ? "#7FAC4E" : "#f44336"} 
            />
            <Text style={styles.detailText}>
              Stripe: {item.stripe_onboarding_completed ? 'Complete' : 'Incomplete'}
            </Text>
          </View>
        </View>

        {!item.is_verified && item.stripe_onboarding_completed && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveSeller(item)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectSeller(item)}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.is_verified && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deactivateButton]}
              onPress={() => handleRejectSeller(item)}
            >
              <Ionicons name="ban" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Deactivate</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading sellers..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sellers}
        renderItem={renderSeller}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No sellers yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  sellerCard: {
    marginBottom: 16,
    padding: 16,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statusBadges: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
  },
  verifiedText: {
    fontSize: 12,
    color: '#7FAC4E',
    marginLeft: 4,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  inactiveText: {
    fontSize: 12,
    color: '#f44336',
    marginLeft: 4,
    fontWeight: '600',
  },
  details: {
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
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#7FAC4E',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  deactivateButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default ManageSellersScreen;
