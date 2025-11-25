import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { refreshOnboardingLink } from '../../services/stripeService';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner, Card } from '../../components';

type Seller = {
  id: string;
  business_name: string;
  stripe_account_id: string | null;
  stripe_account_status: string;
  stripe_onboarding_completed: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  is_verified: boolean;
  is_active: boolean;
};

type SellerOnboardingStatusScreenProps = NativeStackScreenProps<
  AccountStackParamList,
  'SellerOnboardingStatus'
>;

const SellerOnboardingStatusScreen: React.FC<SellerOnboardingStatusScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    fetchSellerStatus();
  }, []);

  const fetchSellerStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSeller(data);
    } catch (error) {
      console.error('Error fetching seller status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellerStatus();
  };

  const handleContinueOnboarding = async () => {
    if (!seller?.stripe_account_id) return;

    try {
      const { url } = await refreshOnboardingLink(seller.stripe_account_id);
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening onboarding link:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading status..." />;
  }

  if (!seller) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Seller account not found</Text>
      </View>
    );
  }

  const getStatusInfo = () => {
    if (seller.is_verified && seller.stripe_onboarding_completed) {
      return {
        icon: 'checkmark-circle',
        iconColor: '#4CAF50',
        title: 'All Set!',
        message: 'Your seller account is active and ready to go.',
        action: 'Go to Dashboard',
        actionHandler: () => navigation.navigate('Profile'),
      };
    }

    if (!seller.stripe_onboarding_completed) {
      return {
        icon: 'time',
        iconColor: '#FF9800',
        title: 'Complete Stripe Onboarding',
        message: 'Finish setting up your Stripe account to receive payments.',
        action: 'Continue Onboarding',
        actionHandler: handleContinueOnboarding,
      };
    }

    if (!seller.is_verified) {
      return {
        icon: 'hourglass',
        iconColor: '#2196F3',
        title: 'Pending Verification',
        message: 'Your account is under review. We\'ll notify you once approved.',
        action: null,
        actionHandler: null,
      };
    }

    return {
      icon: 'alert-circle',
      iconColor: '#f44336',
      title: 'Action Required',
      message: 'There\'s an issue with your account. Please contact support.',
      action: null,
      actionHandler: null,
    };
  };

  const status = getStatusInfo();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Status Card */}
      <Card style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons name={status.icon as any} size={64} color={status.iconColor} />
        </View>
        <Text style={styles.statusTitle}>{status.title}</Text>
        <Text style={styles.statusMessage}>{status.message}</Text>

        {status.action && status.actionHandler && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={status.actionHandler}
          >
            <Text style={styles.actionButtonText}>{status.action}</Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup Checklist</Text>

        <View style={styles.checklistItem}>
          <Ionicons
            name={seller.stripe_account_id ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={seller.stripe_account_id ? '#4CAF50' : '#ccc'}
          />
          <Text style={styles.checklistText}>Stripe account created</Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons
            name={seller.stripe_onboarding_completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={seller.stripe_onboarding_completed ? '#4CAF50' : '#ccc'}
          />
          <Text style={styles.checklistText}>Stripe onboarding completed</Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons
            name={seller.stripe_charges_enabled ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={seller.stripe_charges_enabled ? '#4CAF50' : '#ccc'}
          />
          <Text style={styles.checklistText}>Payments enabled</Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons
            name={seller.stripe_payouts_enabled ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={seller.stripe_payouts_enabled ? '#4CAF50' : '#ccc'}
          />
          <Text style={styles.checklistText}>Payouts enabled</Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons
            name={seller.is_verified ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={seller.is_verified ? '#4CAF50' : '#ccc'}
          />
          <Text style={styles.checklistText}>Admin verified</Text>
        </View>
      </View>

      {/* Business Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{seller.business_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: seller.is_active ? '#4CAF50' : '#f44336' }
            ]}>
              {seller.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </Card>
      </View>

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <Card style={styles.helpCard}>
          <Text style={styles.helpText}>
            If you're experiencing issues with onboarding or have questions,
            please contact our support team.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="mail-outline" size={20} color="#4CAF50" />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  statusCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  helpCard: {
    padding: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});

export default SellerOnboardingStatusScreen;
