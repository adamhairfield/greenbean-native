import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CartStackParamList, MainTabParamList } from '../../navigation/types';
import { useCart } from '../../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components';

type CartScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<CartStackParamList, 'CartMain'>,
  BottomTabNavigationProp<MainTabParamList>
>;

type CartScreenProps = {
  navigation: CartScreenNavigationProp;
};

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { items, loading, updateQuantity, removeItem, subtotal: cartSubtotal } = useCart();

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(productId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
      return;
    }
    navigation.navigate('Checkout');
  };

  if (loading) {
    return <LoadingSpinner message="Loading cart..." />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Add some fresh products from local farms to get started!
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = cartSubtotal;
  
  // Tiered delivery fees
  const getDeliveryFee = (subtotal: number): number => {
    if (subtotal >= 80) return 0;      // $80+: FREE
    if (subtotal >= 60) return 4;      // $60-$79.99: $4
    if (subtotal >= 40) return 6;      // $40-$59.99: $6
    return 6;                          // Below minimum: $6
  };
  
  const deliveryFee = getDeliveryFee(subtotal);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ProductDetail', {
                  productId: item.product_id,
                })
              }
            >
              {item.product?.image_url ? (
                <Image
                  source={{ uri: item.product.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.placeholderEmoji}>🥬</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.itemDetails}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ProductDetail', {
                    productId: item.product_id,
                  })
                }
              >
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product?.name}
                </Text>
                <Text style={styles.productFarm}>
                  {item.product?.farm_name || 'Local Farm'}
                </Text>
              </TouchableOpacity>

              <View style={styles.itemFooter}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      handleUpdateQuantity(item.product_id, item.quantity - 1)
                    }
                  >
                    <Ionicons name="remove" size={20} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      handleUpdateQuantity(item.product_id, item.quantity + 1)
                    }
                  >
                    <Ionicons name="add" size={20} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </Text>
                  <Text style={styles.unit}>
                    ${item.product?.price.toFixed(2)}/{item.product?.unit}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.product_id)}
            >
              <Ionicons name="trash-outline" size={24} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            {/* Show incentive if not at free delivery yet */}
            {subtotal < 80 && subtotal >= 40 && (
              <View style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#E8F5E9', borderRadius: 8, marginVertical: 8 }}>
                <Text style={{ color: '#2E7D32', fontSize: 13, textAlign: 'center' }}>
                  💚 Add ${(80 - subtotal).toFixed(2)} more for FREE delivery!
                </Text>
              </View>
            )}

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
        }
      />

      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotal}>Total</Text>
          <Text style={styles.bottomTotalValue}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#34A853',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productFarm: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34A853',
  },
  unit: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
    color: '#34A853',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomTotal: {
    fontSize: 16,
    color: '#666',
  },
  bottomTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#34A853',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CartScreen;
