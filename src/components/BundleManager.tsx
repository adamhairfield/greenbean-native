import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export type BundleItem = {
  id?: string;
  included_product_id: string;
  included_variant_id?: string | null;
  quantity: number;
  product_name?: string;
  variant_name?: string;
};

interface BundleManagerProps {
  sellerId: string;
  bundleItems: BundleItem[];
  onBundleItemsChange: (items: BundleItem[]) => void;
}

const BundleManager: React.FC<BundleManagerProps> = ({
  sellerId,
  bundleItems,
  onBundleItemsChange,
}) => {
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (showProductPicker) {
      fetchSellerProducts();
    }
  }, [showProductPicker]);

  const fetchSellerProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, unit, has_variants')
        .eq('seller_id', sellerId)
        .eq('is_available', true)
        .order('name');

      if (data) {
        setAvailableProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addBundleItem = (product: any) => {
    const newItem: BundleItem = {
      included_product_id: product.id,
      quantity: 1,
      product_name: product.name,
    };
    onBundleItemsChange([...bundleItems, newItem]);
    setShowProductPicker(false);
    setSearchQuery('');
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...bundleItems];
    updated[index].quantity = Math.max(1, quantity);
    onBundleItemsChange(updated);
  };

  const removeItem = (index: number) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from the bundle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = bundleItems.filter((_, i) => i !== index);
            onBundleItemsChange(updated);
          },
        },
      ]
    );
  };

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bundle Contents</Text>
        <TouchableOpacity
          onPress={() => setShowProductPicker(true)}
          style={styles.addButton}
        >
          <Ionicons name="add-circle" size={24} color="#34A853" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {bundleItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No products in bundle</Text>
          <Text style={styles.emptySubtext}>
            Add products to create a bundle package
          </Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {bundleItems.map((item, index) => (
            <View key={index} style={styles.bundleItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                {item.variant_name && (
                  <Text style={styles.itemVariant}>{item.variant_name}</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(index, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(index, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="add" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Product Picker Modal */}
      <Modal
        visible={showProductPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Product to Bundle</Text>
            <TouchableOpacity onPress={() => setShowProductPicker(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => addBundleItem(item)}
              >
                <View style={styles.productItemInfo}>
                  <Text style={styles.productItemName}>{item.name}</Text>
                  <Text style={styles.productItemPrice}>
                    ${item.price.toFixed(2)} / {item.unit}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#34A853" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>No products found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34A853',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  itemsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
  },
  bundleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 13,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  emptyProducts: {
    padding: 32,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 15,
    color: '#999',
  },
});

export default BundleManager;
