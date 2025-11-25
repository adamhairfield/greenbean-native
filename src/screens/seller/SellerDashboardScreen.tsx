import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createConnectAccount, refreshOnboardingLink } from '../../services/stripeService';
import { Ionicons } from '@expo/vector-icons';
import { Card, LoadingSpinner } from '../../components';

type SellerStats = {
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  pending_revenue: number;
  paid_revenue: number;
};

type Seller = {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  business_address: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string;
  stripe_onboarding_completed: boolean;
  is_verified: boolean;
  is_active: boolean;
};

type SellerDashboardScreenProps = NativeStackScreenProps<
  SellerStackParamList,
  'SellerDashboard'
>;

const SellerDashboardScreen: React.FC<SellerDashboardScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [stats, setStats] = useState<SellerStats>({
    total_products: 0,
    active_products: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_revenue: 0,
    paid_revenue: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch seller info
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      let currentSellerData = sellerData;
      
      if (currentSellerData) {
        setSeller(currentSellerData);

        // Fetch stats using the function
        const { data: statsData } = await supabase
          .rpc('get_seller_stats', { seller_uuid: sellerData.id });

        if (statsData && statsData.length > 0) {
          setStats(statsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDisconnectStripe = async () => {
    if (!seller) return;

    Alert.alert(
      'Disconnect Stripe Account',
      'Are you sure you want to disconnect your Stripe account? You will need to reconnect to receive payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update seller record to remove Stripe account
              const { error } = await supabase
                .from('sellers')
                .update({
                  stripe_account_id: null,
                  stripe_onboarding_completed: false,
                  stripe_charges_enabled: false,
                  stripe_payouts_enabled: false,
                  stripe_account_status: null,
                })
                .eq('id', seller.id);

              if (error) throw error;

              // Refresh data
              await fetchData();

              Alert.alert('Success', 'Stripe account disconnected successfully');
            } catch (error: any) {
              console.error('Error disconnecting Stripe:', error);
              Alert.alert('Error', error.message || 'Failed to disconnect Stripe account');
            }
          },
        },
      ]
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!seller) return;

    try {
      // If no Stripe account exists, create one first
      if (!seller.stripe_account_id) {
        Alert.alert(
          'Creating Stripe Account',
          'We\'ll create your Stripe Connect account and open the onboarding flow.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  const result = await createConnectAccount({
                    userId: user?.id || '',
                    businessName: seller.business_name,
                    businessEmail: seller.business_email,
                    businessPhone: seller.business_phone || '',
                    businessAddress: seller.business_address || '',
                  });

                  if (result.onboardingUrl) {
                    const browserResult = await WebBrowser.openBrowserAsync(result.onboardingUrl, {
                      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                      controlsColor: '#4CAF50',
                    });
                    
                    // Refresh seller data when browser closes
                    await fetchData();
                    
                    // Show success message
                    Alert.alert(
                      'Onboarding Started',
                      'Please check your seller dashboard for the latest status. It may take a few moments for Stripe to update your account.',
                      [{ text: 'OK' }]
                    );
                  }
                  
                  // Refresh seller data
                  await fetchData();
                } catch (error: any) {
                  console.error('Error creating Stripe account:', error);
                  Alert.alert('Error', error.message || 'Failed to create Stripe account');
                }
              },
            },
          ]
        );
      } else {
        // Account exists, get a new onboarding link
        try {
          const result = await refreshOnboardingLink(seller.stripe_account_id);
          if (result.url) {
            const browserResult = await WebBrowser.openBrowserAsync(result.url, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              controlsColor: '#4CAF50',
            });
            
            // Refresh seller data when browser closes
            await fetchData();
            
            // Show success message
            Alert.alert(
              'Onboarding Continued',
              'Please check your seller dashboard for the latest status.',
              [{ text: 'OK' }]
            );
          }
        } catch (error: any) {
          console.error('Error getting onboarding link:', error);
          Alert.alert('Error', error.message || 'Failed to open onboarding');
        }
      }
    } catch (error) {
      console.error('Error handling onboarding:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!seller) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Seller account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.businessName}>{seller.business_name}</Text>
      </View>

      {/* Account Status */}
      {!seller.stripe_onboarding_completed && (
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning-outline" size={24} color="#FF9800" />
            <Text style={styles.warningTitle}>Complete Onboarding</Text>
          </View>
          <Text style={styles.warningText}>
            Complete your Stripe Connect onboarding to start receiving payments
          </Text>
          <TouchableOpacity 
            style={styles.warningButton}
            onPress={handleCompleteOnboarding}
          >
            <Text style={styles.warningButtonText}>Complete Setup</Text>
          </TouchableOpacity>
        </Card>
      )}

      {!seller.is_verified && seller.stripe_onboarding_completed && (
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
            <Text style={styles.infoTitle}>Pending Verification</Text>
          </View>
          <Text style={styles.infoText}>
            Your account is under review. You'll be notified once approved.
          </Text>
        </Card>
      )}

      {/* Revenue Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              ${stats.total_revenue.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              ${stats.paid_revenue.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Paid Out</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              ${stats.pending_revenue.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
        </View>
      </View>

      {/* Product Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCardWide}>
            <View style={styles.statRow}>
              <Ionicons name="cube-outline" size={32} color="#4CAF50" />
              <View style={styles.statInfo}>
                <Text style={styles.statValueLarge}>{stats.total_products}</Text>
                <Text style={styles.statLabel}>Total Products</Text>
              </View>
            </View>
          </Card>
          <Card style={styles.statCardWide}>
            <View style={styles.statRow}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF50" />
              <View style={styles.statInfo}>
                <Text style={styles.statValueLarge}>{stats.active_products}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SellerProducts')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="list-outline" size={24} color="#4CAF50" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Products</Text>
            <Text style={styles.actionSubtitle}>
              View and edit your product inventory
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddSellerProduct')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Product</Text>
            <Text style={styles.actionSubtitle}>
              Add a new product to your inventory
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Disconnect Stripe Button - Only show if connected */}
        {seller.stripe_account_id && (
          <TouchableOpacity
            style={[styles.actionButton, styles.disconnectButton]}
            onPress={handleDisconnectStripe}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="unlink-outline" size={24} color="#f44336" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, styles.disconnectText]}>
                Disconnect Stripe
              </Text>
              <Text style={styles.actionSubtitle}>
                Remove your Stripe Connect account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  warningCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardWide: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statInfo: {
    marginLeft: 12,
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  disconnectButton: {
    borderColor: '#ffebee',
    borderWidth: 1,
  },
  disconnectText: {
    color: '#f44336',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SellerDashboardScreen;
