import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createConnectAccount } from '../../services/stripeService';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

type BecomeSellerScreenProps = NativeStackScreenProps<
  AccountStackParamList,
  'BecomeSeller'
>;

const BecomeSellerScreen: React.FC<BecomeSellerScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Debug: Check if API key is loaded
  console.log('Google Places API Key:', GOOGLE_PLACES_API_KEY ? 'Loaded ✓' : 'Missing ✗');

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch address suggestions
  const fetchAddressSuggestions = async (input: string) => {
    if (!input || input.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&types=address&components=country:us&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        setAddressSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.error('Places API error:', data.status, data.error_message);
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressSuggestions([]);
    }
  };

  // Handle address input change with debounce
  const handleAddressChange = (text: string) => {
    setBusinessAddress(text);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchAddressSuggestions(text);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: PlacePrediction) => {
    setBusinessAddress(suggestion.description);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!businessName.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }
    if (!businessEmail.trim()) {
      Alert.alert('Error', 'Please enter your business email');
      return;
    }

    setLoading(true);

    try {
      // First, update user role to seller
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Create seller profile in database
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .insert({
          user_id: user?.id,
          business_name: businessName.trim(),
          business_email: businessEmail.trim(),
          business_phone: businessPhone.trim() || null,
          business_address: businessAddress.trim() || null,
          business_description: businessDescription.trim() || null,
        })
        .select()
        .single();

      if (sellerError) throw sellerError;

      // Create Stripe Connect account
      try {
        const stripeAccount = await createConnectAccount({
          userId: user?.id || '',
          businessName: businessName.trim(),
          businessEmail: businessEmail.trim(),
          businessPhone: businessPhone.trim(),
          businessAddress: businessAddress.trim(),
        });

        // Navigate to Stripe onboarding
        Alert.alert(
          'Success!',
          'Your seller account has been created. Next, complete your Stripe onboarding to receive payments.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // In a real app, you would open the Stripe onboarding URL
                // For now, navigate to seller onboarding status
                navigation.navigate('SellerOnboardingStatus');
              },
            },
          ]
        );
      } catch (stripeError) {
        // If Stripe fails, still allow them to continue
        console.error('Stripe error:', stripeError);
        Alert.alert(
          'Account Created',
          'Your seller account has been created. You can complete Stripe onboarding later from your seller dashboard.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('SellerOnboardingStatus'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating seller account:', error);
      Alert.alert('Error', error.message || 'Failed to create seller account');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Creating your seller account..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="storefront" size={48} color="#7FAC4E" />
          <Text style={styles.title}>Become a Seller</Text>
          <Text style={styles.subtitle}>
            Start selling your farm-fresh products on Greenbean
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color="#7FAC4E" />
            <Text style={styles.benefitText}>Reach local customers</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color="#7FAC4E" />
            <Text style={styles.benefitText}>Manage your inventory easily</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color="#7FAC4E" />
            <Text style={styles.benefitText}>Secure payments via Stripe</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color="#7FAC4E" />
            <Text style={styles.benefitText}>Track your sales and revenue</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Business Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g., Green Valley Farm"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Business Email *</Text>
            <TextInput
              style={styles.input}
              value={businessEmail}
              onChangeText={setBusinessEmail}
              placeholder="business@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Business Phone</Text>
            <TextInput
              style={styles.input}
              value={businessPhone}
              onChangeText={setBusinessPhone}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Business Address</Text>
            <View style={styles.autocompleteContainer}>
              <TextInput
                style={styles.input}
                value={businessAddress}
                onChangeText={handleAddressChange}
                placeholder="123 Farm Road, City, State 12345"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (businessAddress.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {showSuggestions && addressSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {addressSuggestions.map((item, index) => (
                    <View key={item.place_id}>
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <View style={styles.suggestionText}>
                          <Text style={styles.suggestionMain}>
                            {item.structured_formatting.main_text}
                          </Text>
                          <Text style={styles.suggestionSecondary}>
                            {item.structured_formatting.secondary_text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {index < addressSuggestions.length - 1 && (
                        <View style={styles.suggestionSeparator} />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>About Your Business</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessDescription}
              onChangeText={setBusinessDescription}
              placeholder="Tell customers about your farm and products..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Fee Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Platform Fees</Text>
            <Text style={styles.infoText}>
              Greenbean charges a 10% platform fee on sales. You keep 90% of each sale.
              Delivery fees go to the platform.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            Create Seller Account
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  form: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  autocompleteContainer: {
    position: 'relative',
    zIndex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 12,
    color: '#666',
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#7FAC4E',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BecomeSellerScreen;
