import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { OrdersStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Truck, Calendar, Store, MapPin, Phone, Package, Image as ImageIcon, Receipt, CheckCircle, Clock, Camera } from 'lucide-react-native';
import { LoadingSpinner } from '../../components';
import { Database } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { processRefund } from '../../services/stripeService';

type Order = Database['public']['Tables']['orders']['Row'] & {
  delivery_address?: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    delivery_instructions?: string | null;
  };
};
type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    image_url: string | null;
    seller?: {
      business_name: string;
      business_address?: string;
      business_phone?: string;
    };
  };
};

type OrderDetailScreenProps = {
  navigation: NativeStackNavigationProp<OrdersStackParamList, 'OrderDetail'>;
  route: RouteProp<OrdersStackParamList, 'OrderDetail'>;
};

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ route }) => {
  const { orderId } = route.params;
  const { isRole } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundQuantities, setRefundQuantities] = useState<Map<string, number>>(new Map());
  const [refundNote, setRefundNote] = useState('');
  const [showDeliveryPhotoModal, setShowDeliveryPhotoModal] = useState(false);
  const [deliveryPhotoUri, setDeliveryPhotoUri] = useState<string | null>(null);

  const isSeller = isRole(['seller']);
  const isDriver = isRole(['driver']);
  const isAdmin = isRole(['admin', 'master']);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      // Fetch order with delivery address
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_address:addresses(
            street_address,
            city,
            state,
            zip_code,
            delivery_instructions
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData as any);

      // Fetch order items with products and seller info
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(
            id,
            name,
            image_url,
            seller:sellers(
              business_name,
              business_address,
              business_phone
            )
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData as any || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FF9800',
      confirmed: '#2196F3',
      preparing: '#9C27B0',
      ready_for_delivery: '#7FAC4E',
      out_for_delivery: '#00BCD4',
      delivered: '#7FAC4E',
      cancelled: '#f44336',
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone conversion issues
    // dateString format: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    // If marking as delivered, require photo
    if (newStatus === 'delivered' && isDriver) {
      setShowDeliveryPhotoModal(true);
      return;
    }

    Alert.alert(
      'Update Order Status',
      `Mark this order as ${newStatus.replace(/_/g, ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

              if (error) throw error;

              // Refresh order details
              await fetchOrderDetails();
              Alert.alert('Success', 'Order status updated successfully');
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update order status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const takeDeliveryPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take delivery photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDeliveryPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadDeliveryPhoto = async (photoUri: string): Promise<string | null> => {
    try {
      const fileExt = photoUri.split('.').pop() || 'jpg';
      const fileName = `${order!.id}_${Date.now()}.${fileExt}`;
      const filePath = `delivery-photos/${fileName}`;

      // Read file as ArrayBuffer for React Native
      const response = await fetch(photoUri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(filePath, fileData, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const confirmDelivery = async () => {
    if (!deliveryPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photo of the delivered order.');
      return;
    }

    setUpdating(true);
    try {
      // Upload photo
      const photoUrl = await uploadDeliveryPhoto(deliveryPhotoUri);
      
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      // Update order status and add delivery photo
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivery_photo_url: photoUrl,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', order!.id);

      if (error) throw error;

      // Reset and close modal
      setDeliveryPhotoUri(null);
      setShowDeliveryPhotoModal(false);
      
      // Refresh order details
      await fetchOrderDetails();
      Alert.alert('Success', 'Order marked as delivered successfully');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Error', 'Failed to confirm delivery');
    } finally {
      setUpdating(false);
    }
  };

  const canUpdateStatus = () => {
    if (!order) return false;
    if (isAdmin) return true;
    if (isSeller && order.status === 'pending') return true;
    if (isDriver && (order.status === 'ready_for_delivery' || order.status === 'out_for_delivery')) return true;
    return false;
  };

  const getNextStatus = () => {
    if (!order) return null;
    if (isSeller && order.status === 'pending') return 'ready_for_delivery';
    if (isDriver && order.status === 'ready_for_delivery') return 'out_for_delivery';
    if (isDriver && order.status === 'out_for_delivery') return 'delivered';
    return null;
  };

  const getNextStatusLabel = () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) return '';
    return nextStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleRefund = () => {
    if (!order) return;
    
    if (order.payment_status !== 'paid') {
      Alert.alert('Cannot Refund', 'This order has not been paid yet.');
      return;
    }
    
    // Reset selections and show modal
    setRefundQuantities(new Map());
    setShowRefundModal(true);
  };

  const updateRefundQuantity = (itemId: string, change: number) => {
    setRefundQuantities(prev => {
      const newMap = new Map(prev);
      const item = orderItems.find(i => i.id === itemId);
      if (!item) return prev;
      
      const currentQty = newMap.get(itemId) || 0;
      const newQty = Math.max(0, Math.min(item.quantity, currentQty + change));
      
      if (newQty === 0) {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, newQty);
      }
      
      return newMap;
    });
  };

  const calculateRefundAmount = () => {
    if (!order) return 0;
    
    // Calculate subtotal of selected items with their quantities
    let itemsSubtotal = 0;
    let totalRefundedQty = 0;
    let totalOrderQty = 0;
    
    orderItems.forEach(item => {
      totalOrderQty += item.quantity;
      const refundQty = refundQuantities.get(item.id) || 0;
      if (refundQty > 0) {
        totalRefundedQty += refundQty;
        itemsSubtotal += item.unit_price * refundQty;
      }
    });
    
    // If all items at full quantity are selected, refund everything including fees
    if (totalRefundedQty === totalOrderQty) {
      return order.total;
    }
    
    // For partial refunds, calculate proportional fees
    const itemsRatio = itemsSubtotal / order.subtotal;
    const proportionalDeliveryFee = (order.delivery_fee || 0) * itemsRatio;
    const proportionalTax = (order.tax || 0) * itemsRatio;
    const proportionalStripeFee = ((order as any).stripe_fee || 0) * itemsRatio;
    
    return itemsSubtotal + proportionalDeliveryFee + proportionalTax + proportionalStripeFee;
  };

  const confirmRefund = async () => {
    if (!order) return;
    
    // Prevent duplicate submissions
    if (updating) {
      return;
    }
    
    if (refundQuantities.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to refund.');
      return;
    }
    
    if (!refundNote.trim()) {
      Alert.alert('Note Required', 'Please provide a reason for the refund.');
      return;
    }
    
    const amount = calculateRefundAmount();
    const selectedItems = orderItems.filter(item => refundQuantities.has(item.id));
    const itemsList = selectedItems.map(item => {
      const qty = refundQuantities.get(item.id) || 0;
      return `${item.product.name} (${qty} of ${item.quantity})`;
    }).join(', ');
    
    let totalRefundedQty = 0;
    let totalOrderQty = 0;
    orderItems.forEach(item => {
      totalOrderQty += item.quantity;
      totalRefundedQty += refundQuantities.get(item.id) || 0;
    });
    const isFullRefund = totalRefundedQty === totalOrderQty;
    
    Alert.alert(
      'Confirm Refund',
      `Refund $${amount.toFixed(2)} for: ${itemsList}?${!isFullRefund ? ' (Partial Refund)' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            // Double-check we're not already processing
            if (updating) return;
            
            setUpdating(true);
            try {
              // Process refund through Stripe
              const result = await processRefund({
                orderId: order.id,
                amount: amount,
                reason: `${refundNote}\n\nRefunded items: ${itemsList}`,
              });

              setShowRefundModal(false);
              setRefundQuantities(new Map());
              setRefundNote('');
              await fetchOrderDetails();
              Alert.alert(
                'Refund Processed', 
                `$${amount.toFixed(2)} has been ${result.isFullRefund ? 'fully' : 'partially'} refunded to the customer via Stripe.`
              );
            } catch (error: any) {
              console.error('Error processing refund:', error);
              Alert.alert('Error', error.message || 'Failed to process refund. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
        <View style={styles.statusContainer}>
          <Truck 
            size={20} 
            color={getStatusColor(order.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      {/* Delivery Info */}
      {order.delivery_date && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#7FAC4E" />
            <Text style={styles.sectionTitle}>Delivery Information</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivery Date</Text>
              <Text style={styles.infoValue}>{formatDate(order.delivery_date)}</Text>
            </View>
            {order.special_instructions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Special Instructions</Text>
                <Text style={styles.infoValue}>{order.special_instructions}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Pickup Locations (for drivers and admins) */}
      {(isDriver || isAdmin) && orderItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Store size={20} color="#7FAC4E" />
            <Text style={styles.sectionTitle}>Pickup Locations</Text>
          </View>
          {Array.from(new Set(orderItems.map(item => item.product.seller?.business_name).filter(Boolean))).map((businessName) => {
            const sellerItems = orderItems.filter(item => item.product.seller?.business_name === businessName);
            const seller = sellerItems[0]?.product.seller;
            if (!seller) return null;
            
            return (
              <View key={businessName} style={styles.pickupCard}>
                <Text style={styles.sellerName}>{seller.business_name}</Text>
                {seller.business_address && (
                  <View style={styles.pickupRow}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.pickupText}>{seller.business_address}</Text>
                  </View>
                )}
                {seller.business_phone && (
                  <View style={styles.pickupRow}>
                    <Phone size={16} color="#666" />
                    <Text style={styles.pickupText}>{seller.business_phone}</Text>
                  </View>
                )}
                <View style={styles.pickupRow}>
                  <Package size={16} color="#666" />
                  <Text style={styles.pickupText}>
                    {sellerItems.length} item{sellerItems.length > 1 ? 's' : ''} to pick up
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Delivery Address (for drivers and admins) */}
      {(isDriver || isAdmin) && order.delivery_address && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#7FAC4E" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.addressText}>
                {order.delivery_address.street_address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.addressText}>
                {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}
              </Text>
            </View>
            {order.delivery_address.delivery_instructions && (
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={styles.infoLabel}>Delivery Instructions</Text>
                <Text style={styles.infoValue}>
                  {order.delivery_address.delivery_instructions}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Order Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#7FAC4E" />
          <Text style={styles.sectionTitle}>Items ({orderItems.length})</Text>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.product.image_url ? (
              <Image
                source={{ uri: item.product.image_url }}
                style={styles.itemImage}
              />
            ) : (
              <View style={[styles.itemImage, styles.placeholderImage]}>
                <ImageIcon size={30} color="#999" />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemDetails}>
                ${item.unit_price.toFixed(2)} × {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>${item.total_price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Receipt size={20} color="#7FAC4E" />
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${(order.delivery_fee || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${(order.tax || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {order.payment_status === 'paid' ? (
            <CheckCircle size={20} color="#7FAC4E" />
          ) : (
            <Clock size={20} color="#FF9800" />
          )}
          <Text style={styles.sectionTitle}>Payment Status</Text>
        </View>
        <View style={styles.infoCard}>
          <Text
            style={[
              styles.paymentStatus,
              {
                color: order.payment_status === 'paid' ? '#7FAC4E' : '#FF9800',
              },
            ]}
          >
            {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
          </Text>
        </View>
      </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Seller Refund Button */}
      {(isSeller || isAdmin) && order.status !== 'cancelled' && order.payment_status === 'paid' && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.refundButton]}
            onPress={handleRefund}
            disabled={updating}
          >
            <Text style={styles.actionButtonText}>Process Refund</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Update Status Button (for sellers and drivers) - Fixed at bottom */}
      {canUpdateStatus() && getNextStatus() && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={() => updateOrderStatus(getNextStatus()!)}
            disabled={updating}
          >
            <CheckCircle size={20} color="#fff" />
            <Text style={styles.updateButtonText}>
              {updating ? 'Updating...' : `Mark as ${getNextStatusLabel()}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Refund Modal */}
      <Modal
        visible={showRefundModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRefundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Items to Refund</Text>
              <Text style={styles.modalSubtitle}>
                Choose which items to refund. Fees will be calculated proportionally.
              </Text>
              
              {/* Items List with Quantity Controls */}
              <View style={styles.refundItemsList}>
                {orderItems.map((item) => {
                  const refundQty = refundQuantities.get(item.id) || 0;
                  return (
                    <View key={item.id} style={styles.refundItemCard}>
                      <View style={styles.refundItemInfo}>
                        <Text style={styles.refundItemName}>{item.product.name}</Text>
                        <Text style={styles.refundItemDetails}>
                          ${item.unit_price.toFixed(2)} each · {item.quantity} in order
                        </Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateRefundQuantity(item.id, -1)}
                          disabled={refundQty === 0}
                        >
                          <Text style={[styles.quantityButtonText, refundQty === 0 && styles.quantityButtonDisabled]}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{refundQty}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateRefundQuantity(item.id, 1)}
                          disabled={refundQty >= item.quantity}
                        >
                          <Text style={[styles.quantityButtonText, refundQty >= item.quantity && styles.quantityButtonDisabled]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Refund Summary */}
              {refundQuantities.size > 0 && (
                <View style={styles.refundSummary}>
                  <Text style={styles.refundSummaryTitle}>Refund Amount</Text>
                  <Text style={styles.refundSummaryAmount}>
                    ${calculateRefundAmount().toFixed(2)}
                  </Text>
                  <Text style={styles.refundSummaryNote}>
                    Includes proportional fees
                  </Text>
                </View>
              )}

              {/* Refund Reason */}
              <TextInput
                style={styles.modalInput}
                placeholder="Reason for refund (shown to customer)"
                value={refundNote}
                onChangeText={setRefundNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowRefundModal(false);
                    setRefundQuantities(new Map());
                    setRefundNote('');
                  }}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmRefund}
                  disabled={updating || refundQuantities.size === 0}
                >
                  <Text style={styles.modalButtonText}>
                    {updating ? 'Processing...' : 'Process Refund'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delivery Photo Modal */}
      <Modal
        visible={showDeliveryPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDeliveryPhotoModal(false);
          setDeliveryPhotoUri(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Confirmation</Text>
            <Text style={styles.modalSubtitle}>
              Take a photo of the delivered order for customer verification
            </Text>

            {deliveryPhotoUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: deliveryPhotoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.retakePhotoButton}
                  onPress={takeDeliveryPhoto}
                >
                  <Camera size={20} color="#fff" />
                  <Text style={styles.retakePhotoText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.takePhotoButton}
                onPress={takeDeliveryPhoto}
              >
                <Camera size={48} color="#7FAC4E" />
                <Text style={styles.takePhotoText}>Take Photo</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowDeliveryPhotoModal(false);
                  setDeliveryPhotoUri(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!deliveryPhotoUri || updating) && styles.modalButtonDisabled,
                ]}
                onPress={confirmDelivery}
                disabled={!deliveryPhotoUri || updating}
              >
                <Text style={styles.modalButtonText}>
                  {updating ? 'Confirming...' : 'Confirm Delivery'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  fixedButtonContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    lineHeight: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
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
  paymentStatus: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7FAC4E',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pickupCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundButton: {
    backgroundColor: '#7FAC4E',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
  },
  modalInputSmall: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonConfirm: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextCancel: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  refundItemsList: {
    marginVertical: 16,
  },
  refundItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  refundItemCheckbox: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  refundItemInfo: {
    flex: 1,
  },
  refundItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  refundItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  refundItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  refundSummary: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  refundSummaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  refundSummaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7FAC4E',
  },
  refundSummaryNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7FAC4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  photoPreviewContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  retakePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7FAC4E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retakePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  takePhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7FAC4E',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  takePhotoText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#7FAC4E',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});

export default OrderDetailScreen;
