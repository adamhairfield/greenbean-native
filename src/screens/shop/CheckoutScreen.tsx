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
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    promoCodeId: string;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  
  // Pricing
  const ORDER_MINIMUM = 40.0;
  const subtotal = cartSubtotal;
  
  // Tiered delivery fees based on subtotal
  const getDeliveryFee = (subtotal: number): number => {
    if (subtotal >= 80) return 0;      // $80+: FREE
    if (subtotal >= 60) return 4;      // $60-$79.99: $4
    if (subtotal >= 40) return 6;      // $40-$59.99: $6
    return 6;                          // Below minimum: $6
  };
  
  const deliveryFee = getDeliveryFee(subtotal);
  const discount = appliedPromo?.discount || 0;
  const tax = (subtotal - discount) * 0.08;
  
  // Stripe fees: 2.9% + $0.30 per transaction
  const STRIPE_PERCENTAGE = 0.029;
  const STRIPE_FIXED_FEE = 0.30;
  const stripeFee = (subtotal - discount + deliveryFee + tax) * STRIPE_PERCENTAGE + STRIPE_FIXED_FEE;
  
  const total = subtotal - discount + deliveryFee + tax + stripeFee;
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

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }

    setPromoLoading(true);

    try {
      const { data, error } = await supabase
        .rpc('validate_promo_code', {
          p_code: promoCode.trim().toUpperCase(),
          p_user_id: user!.id,
          p_order_total: subtotal,
        });

      if (error) throw error;

      const result = data[0];

      if (result.valid) {
        setAppliedPromo({
          code: promoCode.trim().toUpperCase(),
          discount: result.discount_amount,
          promoCodeId: result.promo_code_id,
        });
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Invalid Code', result.message);
      }
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      Alert.alert('Error', 'Failed to apply promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
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
      // Validate inventory before proceeding
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          throw new Error('Failed to verify product availability');
        }

        if (product.stock_quantity < item.quantity) {
          Alert.alert(
            'Insufficient Stock',
            `Sorry, "${product.name}" only has ${product.stock_quantity} available. Please update your cart.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Get the selected schedule's delivery date
      const selectedSchedule = deliverySchedules.find(s => s.schedule_id === selectedScheduleId);
      if (!selectedSchedule) {
        throw new Error('Selected delivery schedule not found');
      }

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
      console.log('Payment details:', {
        subtotal,
        discount,
        deliveryFee,
        tax,
        stripeFee,
        total,
      });

      // Validate total amount
      if (total <= 0) {
        throw new Error('Invalid order total');
      }
      
      // For now, we'll create a payment intent without an order ID
      // The payment intent will be created, and we'll create the order after payment succeeds
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        orderId: tempOrderId, // Temporary ID
        amount: total,
        currency: 'usd',
      });

      console.log('Payment intent created successfully:', paymentIntentId);

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
      
      // Prepare order data with payment intent ID
      const orderData = {
        customer_id: user!.id,
        delivery_address_id: selectedAddressId,
        delivery_schedule_id: selectedScheduleId,
        delivery_date: selectedSchedule?.next_delivery_date,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        tax,
        total,
        special_instructions: specialInstructions || null,
        status: 'pending',
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        stripe_fee: stripeFee,
      };
      
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

      // Track promo code usage if applied
      if (appliedPromo) {
        await supabase.from('promo_code_usage').insert({
          promo_code_id: appliedPromo.promoCodeId,
          user_id: user!.id,
          order_id: order.id,
          discount_amount: discount,
        });

        // Increment usage count
        await supabase.rpc('increment_promo_usage', {
          p_promo_code_id: appliedPromo.promoCodeId,
        });
      }

      // Clear cart
      await clearCart();

      // Show success and navigate
      Alert.alert(
        'Order Placed!',
        `Your order #${order.order_number} has been placed and paid successfully. We'll notify you when it's on the way!`,
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
        <ActivityIndicator size="large" color="#7FAC4E" />
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
          <View style={styles.deliveryNote}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.deliveryNoteText}>
              Orders must be placed 2 days before delivery. If a day isn't showing, the cutoff has passed.
            </Text>
          </View>
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

        {/* Promo Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoSection}>
            {appliedPromo ? (
              <View style={styles.appliedPromoCard}>
                <View style={styles.appliedPromoInfo}>
                  <Text style={styles.appliedPromoCode}>{appliedPromo.code}</Text>
                  <Text style={styles.appliedPromoDiscount}>
                    -${appliedPromo.discount.toFixed(2)} off
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemovePromo}>
                  <Text style={styles.removePromoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoInputContainer}>
                <TextInput
                  style={styles.promoInput}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder="Enter promo code"
                  placeholderTextColor="#999"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyPromoButton, promoLoading && styles.applyPromoButtonDisabled]}
                  onPress={handleApplyPromo}
                  disabled={promoLoading}
                >
                  {promoLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.applyPromoText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
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
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#7FAC4E' }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#7FAC4E' }]}>-${discount.toFixed(2)}</Text>
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
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Processing Fee</Text>
              <Text style={styles.summaryValue}>${stripeFee.toFixed(2)}</Text>
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
    borderColor: '#7FAC4E',
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
    borderColor: '#7FAC4E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7FAC4E',
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
    backgroundColor: '#7FAC4E',
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
    borderColor: '#7FAC4E',
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
    color: '#7FAC4E',
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
    color: '#7FAC4E',
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
    backgroundColor: '#7FAC4E',
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
  },
  promoSection: {
    marginBottom: 16,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  applyPromoButton: {
    backgroundColor: '#7FAC4E',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyPromoButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyPromoText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  appliedPromoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7FAC4E',
  },
  appliedPromoInfo: {
    flex: 1,
  },
  appliedPromoCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7FAC4E',
    marginBottom: 4,
  },
  appliedPromoDiscount: {
    fontSize: 14,
    color: '#666',
  },
  removePromoText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  deliveryNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default CheckoutScreen;
