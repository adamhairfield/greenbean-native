import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components';

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_available: boolean;
  is_organic: boolean;
  total_sales: number;
  total_revenue: number;
};

type SellerProductsScreenProps = NativeStackScreenProps<
  SellerStackParamList,
  'SellerProducts'
>;

const SellerProductsScreen: React.FC<SellerProductsScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Get seller ID first
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!sellerData) {
        setProducts([]);
        return;
      }

      // Fetch seller's products
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, unit, stock_quantity, low_stock_threshold, image_url, is_available, is_organic, total_sales, total_revenue')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const toggleSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedProducts(new Set(products.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  const handleBulkStockUpdate = () => {
    if (selectedProducts.size === 0) {
      Alert.alert('No Products Selected', 'Please select products to update.');
      return;
    }
    
    Alert.prompt(
      'Bulk Stock Update',
      `Update stock for ${selectedProducts.size} product(s).\nEnter amount to add (use negative to subtract):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (value) => {
            if (!value) return;
            const adjustment = parseInt(value);
            if (isNaN(adjustment)) {
              Alert.alert('Error', 'Please enter a valid number');
              return;
            }

            try {
              const selectedIds = Array.from(selectedProducts);
              const updates = products
                .filter(p => selectedIds.includes(p.id))
                .map(p => ({
                  id: p.id,
                  stock_quantity: Math.max(0, p.stock_quantity + adjustment)
                }));

              for (const update of updates) {
                await supabase
                  .from('products')
                  .update({ stock_quantity: update.stock_quantity })
                  .eq('id', update.id);
              }

              Alert.alert('Success', `Updated ${updates.length} product(s)`);
              setSelectionMode(false);
              setSelectedProducts(new Set());
              fetchProducts();
            } catch (error) {
              console.error('Error updating stock:', error);
              Alert.alert('Error', 'Failed to update stock');
            }
          }
        }
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        if (selectionMode) {
          toggleSelection(item.id);
        } else {
          navigation.navigate('EditSellerProduct', { productId: item.id });
        }
      }}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          {selectedProducts.has(item.id) ? (
            <Ionicons name="checkmark-circle" size={24} color="#34A853" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#ddd" />
          )}
        </View>
      )}
      
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🥬</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.is_organic && (
            <View style={styles.organicBadge}>
              <Text style={styles.organicText}>🌿</Text>
            </View>
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>
            ${item.price.toFixed(2)}/{item.unit}
          </Text>
          <View style={styles.stockRow}>
            <Text style={[
              styles.stockText,
              item.stock_quantity === 0 && styles.outOfStock,
              item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold && styles.lowStock
            ]}>
              Stock: {item.stock_quantity}
            </Text>
            {item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold && (
              <Ionicons name="warning" size={16} color="#FF9800" style={styles.warningIcon} />
            )}
          </View>
        </View>

        <View style={styles.productFooter}>
          <View style={[
            styles.statusBadge,
            item.is_available ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              item.is_available ? styles.statusActiveText : styles.statusInactiveText
            ]}>
              {item.is_available ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      {selectionMode && (
        <View style={styles.bulkToolbar}>
          <View style={styles.bulkToolbarLeft}>
            <Text style={styles.bulkToolbarText}>
              {selectedProducts.size} selected
            </Text>
            <TouchableOpacity onPress={selectAll} style={styles.bulkToolbarButton}>
              <Text style={styles.bulkToolbarButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deselectAll} style={styles.bulkToolbarButton}>
              <Text style={styles.bulkToolbarButtonText}>Deselect</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bulkToolbarRight}>
            <TouchableOpacity onPress={handleBulkStockUpdate} style={styles.bulkActionButton}>
              <Ionicons name="cube-outline" size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Update Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setSelectionMode(false);
                setSelectedProducts(new Set());
              }} 
              style={styles.bulkCancelButton}
            >
              <Text style={styles.bulkCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptyText}>
              Start adding products to your inventory
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddSellerProduct')}
            >
              <Text style={styles.addButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {products.length > 0 && !selectionMode && (
        <>
          <TouchableOpacity
            style={styles.bulkEditFab}
            onPress={() => setSelectionMode(true)}
          >
            <Ionicons name="checkmark-done" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddSellerProduct')}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}
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
    paddingBottom: 80,
  },
  productCard: {
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
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  organicBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organicText: {
    fontSize: 12,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34A853',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
  },
  lowStock: {
    color: '#FF9800',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#f44336',
    fontWeight: '600',
  },
  warningIcon: {
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#34A853',
  },
  statusInactiveText: {
    color: '#f44336',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#34A853',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34A853',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkEditFab: {
    position: 'absolute',
    bottom: 24,
    right: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  checkbox: {
    marginRight: 12,
  },
  bulkToolbar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkToolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulkToolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulkToolbarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bulkToolbarButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bulkToolbarButtonText: {
    fontSize: 13,
    color: '#34A853',
    fontWeight: '500',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34A853',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bulkActionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bulkCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bulkCancelButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default SellerProductsScreen;
