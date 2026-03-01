import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, VariantManager, ProductVariant, ImageGalleryManager, ProductImage } from '../../components';

type Category = {
  id: string;
  name: string;
};

type AddSellerProductScreenProps = NativeStackScreenProps<
  SellerStackParamList,
  'AddSellerProduct'
>;

const AddSellerProductScreen: React.FC<AddSellerProductScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('lb');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images'
        );
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      }

      // Fetch seller ID
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id, business_name, business_address')
        .eq('user_id', user?.id)
        .single();

      if (sellerData) {
        setSellerId(sellerData.id);
        setFarmName(sellerData.business_name || '');
        setFarmLocation(sellerData.business_address || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!stockQuantity || parseInt(stockQuantity) < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return;
    }
    if (!sellerId) {
      Alert.alert('Error', 'Seller account not found');
      return;
    }

    setLoading(true);

    try {
      // Insert product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: sellerId,
          category_id: categoryId || null,
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          unit: unit,
          stock_quantity: parseInt(stockQuantity),
          low_stock_threshold: parseInt(lowStockThreshold),
          image_url: images.length > 0 ? images.find(img => img.is_primary)?.image_url || images[0].image_url : null,
          farm_name: farmName.trim() || null,
          farm_location: farmLocation.trim() || null,
          is_organic: isOrganic,
          is_available: isAvailable,
          has_variants: variants.length > 0,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Insert product images if any
      if (images.length > 0 && newProduct) {
        const imagesToInsert = images.map((img) => ({
          product_id: newProduct.id,
          image_url: img.image_url,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (imagesError) throw imagesError;
      }

      // Insert variants if any
      if (variants.length > 0 && newProduct) {
        const variantsToInsert = variants.map((v) => ({
          product_id: newProduct.id,
          variant_name: v.variant_name,
          variant_type: v.variant_type,
          price_adjustment: v.price_adjustment,
          price_override: v.price_override,
          sku: v.sku || null,
          stock_quantity: v.stock_quantity,
          low_stock_threshold: v.low_stock_threshold,
          is_available: v.is_available,
          is_default: v.is_default,
          sort_order: v.sort_order,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      Alert.alert('Success', 'Product added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding product:', error);
      Alert.alert('Error', error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !sellerId) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (name ? 25 : 0) + (price ? 25 : 0) + (stockQuantity ? 25 : 0) + (images.length > 0 ? 25 : 0))}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {name && price && stockQuantity && images.length > 0 ? 'Ready to publish!' : 'Fill in the required fields'}
          </Text>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Organic Tomatoes"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your product, growing methods, taste, etc."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    categoryId === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      categoryId === cat.id && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Pricing & Inventory Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Pricing & Inventory</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.field, styles.flex1, styles.marginLeft]}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['lb', 'each', 'dozen', 'pint', 'quart', 'bunch'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitButton,
                      unit === u && styles.unitButtonActive,
                    ]}
                    onPress={() => setUnit(u)}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        unit === u && styles.unitButtonTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Stock Quantity *</Text>
            <TextInput
              style={styles.input}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={[styles.field, styles.flex1, styles.marginLeft]}>
            <Text style={styles.label}>Low Stock Alert</Text>
            <TextInput
              style={styles.input}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              placeholder="5"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
          </View>
        </View>

        {/* Product Images Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images" size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Product Images</Text>
            {images.length === 0 && <Text style={styles.requiredBadge}>Required</Text>}
          </View>
          <Text style={styles.sectionDescription}>
            Add photos showing your product from different angles. First image will be the main photo.
          </Text>
          <ImageGalleryManager
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />
        </View>

        {/* Product Variants Section */}
        {parseFloat(price) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={24} color="#34A853" />
              <Text style={styles.sectionTitle}>Product Variants</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Offer different sizes, packaging, or quality tiers at different prices.
            </Text>
            <VariantManager
              variants={variants}
              basePrice={parseFloat(price) || 0}
              onVariantsChange={setVariants}
            />
          </View>
        )}

        {/* Product Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Product Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Organic Certified</Text>
              <Text style={styles.settingDescription}>Mark if this product is certified organic</Text>
            </View>
            <Switch
              value={isOrganic}
              onValueChange={setIsOrganic}
              trackColor={{ false: '#ccc', true: '#34A853' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Available for Sale</Text>
              <Text style={styles.settingDescription}>Customers can purchase this product</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#ccc', true: '#34A853' }}
              thumbColor="#fff"
            />
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
            {loading ? 'Adding Product...' : 'Add Product'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34A853',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optionalBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  unitButtonActive: {
    backgroundColor: '#34A853',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34A853',
    borderWidth: 2,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: '#34A853',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#34A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#34A853',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 16,
    color: '#34A853',
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
});

export default AddSellerProductScreen;
