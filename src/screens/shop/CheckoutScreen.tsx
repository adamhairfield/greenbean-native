import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CartStackParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../types/database';
import { useStripe } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../../services/stripeService';

type Address = Database['public']['Tables']['addresses']['Row'];
type DeliverySchedule = Database['public']['Tables']['delivery_schedules']['Row'];

type CheckoutScreenProps = {
  navigation: NativeStackNavigationProp<CartStackParamList, 'Checkout'>;
};

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { items, subtotal: cartSubtotal, clearCart } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Delivery schedule state
  const [deliverySchedules, setDeliverySchedules] = useState<DeliverySchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  
  // Order details
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Pricing
  const ORDER_MINIMUM = 30.0;
  const subtotal = cartSubtotal;
  const deliveryFee = 5.0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;
  const meetsMinimum = subtotal >= ORDER_MINIMUM;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user addresses
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (addressData && addressData.length > 0) {
        setAddresses(addressData);
        const defaultAddress = addressData.find(a => a.is_default) || addressData[0];
        setSelectedAddressId(defaultAddress.id);
      } else {
        setShowAddressForm(true);
      }

      // Fetch available delivery slots using the database function
      const { data: scheduleData, error: scheduleError } = await supabase
        .rpc('get_available_delivery_slots');

      if (scheduleError) {
        console.error('Error fetching delivery slots:', scheduleError);
      }

      if (scheduleData && scheduleData.length > 0) {
        setDeliverySchedules(scheduleData);
        setSelectedScheduleId(scheduleData[0].schedule_id);
      }
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      Alert.alert('Error', 'Failed to load checkout information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!meetsMinimum) {
      Alert.alert(
        'Order Minimum Not Met',
        `Your order must be at least $${ORDER_MINIMUM.toFixed(2)} before delivery and tax. Please add $${(ORDER_MINIMUM - subtotal).toFixed(2)} more to your cart.`
      );
      return;
    }

    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return;
    }

    if (!selectedScheduleId) {
      Alert.alert('Delivery Schedule Required', 'Please select a delivery time');
      return;
    }

    setSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Get the selected schedule's delivery date
      const selectedSchedule = deliverySchedules.find(s => s.schedule_id === selectedScheduleId);
      
      console.log('Preparing order data');
      console.log('Delivery date:', selectedSchedule?.next_delivery_date);
      console.log('Payment amount:', total);

      // Prepare order data (don't insert yet)
      const orderData = {
        customer_id: user!.id,
        order_number: orderNumber,
        delivery_address_id: selectedAddressId,
        delivery_schedule_id: selectedScheduleId,
        delivery_date: selectedSchedule?.next_delivery_date,
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        total,
        special_instructions: specialInstructions || null,
        status: 'pending',
        payment_status: 'paid', // Will be paid after Stripe succeeds
      };

      // Prepare order items data
      const orderItemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }));

      // Create a temporary order ID for payment intent
      const tempOrderId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create Stripe payment intent FIRST (before creating order)
      console.log('Creating payment intent');
      
      // For now, we'll create a payment intent without an order ID
      // The payment intent will be created, and we'll create the order after payment succeeds
      const { clientSecret } = await createPaymentIntent({
        orderId: tempOrderId, // Temporary ID
        amount: total,
        currency: 'usd',
      });

      console.log('Payment intent created successfully');

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Greenbean',
        returnURL: 'greenbean://payment-complete',
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        throw new Error('Failed to initialize payment');
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.error('Payment error:', paymentError);
        // Payment was cancelled or failed - don't create order
        Alert.alert(
          'Payment Cancelled',
          'Payment was not completed. No order was created.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Payment successful! Now create the order
      console.log('Payment successful, creating order in database');
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id, order_number')
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        throw new Error('Payment succeeded but failed to create order. Please contact support.');
      }

      console.log('Order created:', order.id);

      // Create order items
      const orderItems = orderItemsData.map(item => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        // Order exists but items failed - this is a problem
        throw new Error('Order created but failed to add items. Please contact support.');
      }

      console.log('Order items created successfully');

      // Clear cart
      await clearCart();

      // Show success and navigate
      Alert.alert(
        'Order Placed!',
        `Your order #${orderNumber} has been placed and paid successfully. We'll notify you when it's on the way!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone conversion issues
    // dateString format: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDeliveryWindowLabel = (window: string) => {
    const labels: { [key: string]: string } = {
      morning: '8AM - 12PM',
      afternoon: '12PM - 4PM',
      evening: '4PM - 8PM',
    };
    return labels[window] || window;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddressId === address.id && styles.addressCardSelected,
                ]}
                onPress={() => setSelectedAddressId(address.id)}
              >
                <View style={styles.addressHeader}>
                  <View style={styles.radioButton}>
                    {selectedAddressId === address.id && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>
                      {address.is_default ? 'Home' : 'Address'}
                    </Text>
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.addressText}>{address.street_address}</Text>
                {address.apartment && (
                  <Text style={styles.addressText}>{address.apartment}</Text>
                )}
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.zip_code}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No addresses found. Please add one.</Text>
          )}
        </View>

        {/* Delivery Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Schedule</Text>
          {deliverySchedules.length > 0 ? (
            deliverySchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.schedule_id}
                style={[
                  styles.scheduleCard,
                  selectedScheduleId === schedule.schedule_id && styles.scheduleCardSelected,
                ]}
                onPress={() => setSelectedScheduleId(schedule.schedule_id)}
              >
                <View style={styles.radioButton}>
                  {selectedScheduleId === schedule.schedule_id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleDate}>
                    {formatDate(schedule.next_delivery_date)}
                  </Text>
                  <Text style={styles.scheduleCapacity}>
                    {schedule.slots_available > 0 
                      ? `${schedule.slots_available} ${schedule.slots_available === 1 ? 'order' : 'orders'} left`
                      : 'Fully booked'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>
              No delivery schedules available at this time.
            </Text>
          )}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="e.g., Leave at front door, Ring doorbell"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {!meetsMinimum && (
            <View style={styles.minimumWarning}>
              <Ionicons name="alert-circle" size={20} color="#FF9800" />
              <Text style={styles.minimumWarningText}>
                Add ${(ORDER_MINIMUM - subtotal).toFixed(2)} more to meet the ${ORDER_MINIMUM.toFixed(2)} minimum
              </Text>
            </View>
          )}
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({items.length})</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            {!meetsMinimum && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#FF9800' }]}>
                  Minimum Required
                </Text>
                <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                  ${ORDER_MINIMUM.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedAddressId || !selectedScheduleId || !meetsMinimum || submitting) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddressId || !selectedScheduleId || !meetsMinimum || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  addressCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  addressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
    lineHeight: 20,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleWindow: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduleCapacity: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  instructionsInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  minimumWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  minimumWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomTotalLabel: {
    fontSize: 16,
    color: '#666',
  },
  bottomTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CheckoutScreen;
