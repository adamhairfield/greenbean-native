import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShopStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useCart } from '../../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components';

type Product = Database['public']['Tables']['products']['Row'];

type ProductDetailScreenProps = NativeStackScreenProps<
  ShopStackParamList,
  'ProductDetail'
>;

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { productId } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addItem(product.id, quantity);
      Alert.alert(
        'Added to Cart',
        `${quantity} ${product.unit} of ${product.name} added to your cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const incrementQuantity = () => {
    if (!product || product.stock_quantity === null) return;
    
    if (quantity >= product.stock_quantity) {
      Alert.alert(
        'Maximum Quantity Reached',
        `Only ${product.stock_quantity} ${product.unit} available in stock.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Product Image */}
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🥬</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.farmName}>{product.farm_name}</Text>
              {product.farm_location && (
                <Text style={styles.farmLocation}>📍 {product.farm_location}</Text>
              )}
            </View>
            {product.is_organic && (
              <View style={styles.organicBadge}>
                <Text style={styles.organicText}>🌿 Organic</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            {product.stock_quantity > 0 ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.inStock}>
                  In Stock ({product.stock_quantity} available)
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#f44336" />
                <Text style={styles.outOfStock}>Out of Stock</Text>
              </>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit:</Text>
              <Text style={styles.detailValue}>{product.unit}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farm:</Text>
              <Text style={styles.detailValue}>{product.farm_name}</Text>
            </View>
            {product.farm_location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{product.farm_location}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Organic:</Text>
              <Text style={styles.detailValue}>
                {product.is_organic ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {product.is_available && product.stock_quantity > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decrementQuantity}
            >
              <Ionicons name="remove" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={incrementQuantity}
            >
              <Ionicons name="add" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text style={styles.addToCartText}>
              Add to Cart · ${(product.price * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  infoContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  farmName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  farmLocation: {
    fontSize: 14,
    color: '#999',
  },
  organicBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  organicText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  unit: {
    fontSize: 16,
    color: '#666',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  inStock: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '600',
  },
  outOfStock: {
    fontSize: 14,
    color: '#f44336',
    marginLeft: 8,
    fontWeight: '600',
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
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 12,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
