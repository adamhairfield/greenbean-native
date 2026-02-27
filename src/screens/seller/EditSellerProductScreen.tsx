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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner, VariantManager, ProductVariant, ImageGalleryManager, ProductImage } from '../../components';

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string | null;
  image_url: string | null;
  farm_name: string | null;
  farm_location: string | null;
  is_organic: boolean;
  is_available: boolean;
};

type EditSellerProductScreenProps = NativeStackScreenProps<
  SellerStackParamList,
  'EditSellerProduct'
>;

const EditSellerProductScreen: React.FC<EditSellerProductScreenProps> = ({
  route,
  navigation,
}) => {
  const { productId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

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
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (categoriesData) setCategories(categoriesData);

      // Fetch product
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (productData) {
        setProduct(productData);
        setName(productData.name);
        setDescription(productData.description || '');
        setPrice(productData.price.toString());
        setUnit(productData.unit);
        setStockQuantity(productData.stock_quantity.toString());
        setLowStockThreshold(productData.low_stock_threshold.toString());
        setCategoryId(productData.category_id || '');
        setFarmName(productData.farm_name || '');
        setFarmLocation(productData.farm_location || '');
        setIsOrganic(productData.is_organic);
        setIsAvailable(productData.is_available);

        // Fetch product images
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order');

        if (imagesData && imagesData.length > 0) {
          setImages(imagesData.map(img => ({
            id: img.id,
            image_url: img.image_url,
            is_primary: img.is_primary,
            sort_order: img.sort_order,
          })));
        }

        // Fetch variants
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order');

        if (variantsData) {
          setVariants(variantsData.map(v => ({
            id: v.id,
            variant_name: v.variant_name,
            variant_type: v.variant_type,
            price_adjustment: v.price_adjustment,
            price_override: v.price_override,
            sku: v.sku || '',
            stock_quantity: v.stock_quantity,
            low_stock_threshold: v.low_stock_threshold,
            is_available: v.is_available,
            is_default: v.is_default,
            sort_order: v.sort_order,
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
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

    setSaving(true);

    try {
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          unit: unit,
          stock_quantity: parseInt(stockQuantity),
          low_stock_threshold: parseInt(lowStockThreshold),
          category_id: categoryId || null,
          image_url: images.length > 0 ? images.find(img => img.is_primary)?.image_url || images[0].image_url : null,
          farm_name: farmName.trim() || null,
          farm_location: farmLocation.trim() || null,
          is_organic: isOrganic,
          is_available: isAvailable,
          has_variants: variants.length > 0,
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Delete existing product images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // Insert updated product images
      if (images.length > 0) {
        const imagesToInsert = images.map((img) => ({
          product_id: productId,
          image_url: img.image_url,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);

        if (imagesError) throw imagesError;
      }

      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      // Insert updated variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v) => ({
          product_id: productId,
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

      Alert.alert('Success', 'Product updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert('Error', error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!product) return;

    Alert.alert(
      'Duplicate Product',
      'Create a copy of this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Get seller ID
              const { data: sellerData } = await supabase
                .from('sellers')
                .select('id')
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                .single();

              if (!sellerData) throw new Error('Seller not found');

              // Create duplicate with "(Copy)" appended to name
              const { data: newProduct, error } = await supabase
                .from('products')
                .insert({
                  seller_id: sellerData.id,
                  category_id: product.category_id,
                  name: `${product.name} (Copy)`,
                  description: product.description,
                  price: product.price,
                  unit: product.unit,
                  stock_quantity: 0, // Start with 0 stock for duplicated product
                  low_stock_threshold: product.low_stock_threshold,
                  image_url: product.image_url,
                  farm_name: product.farm_name,
                  farm_location: product.farm_location,
                  is_organic: product.is_organic,
                  is_available: false, // Start as inactive
                })
                .select()
                .single();

              if (error) throw error;

              Alert.alert('Success', 'Product duplicated successfully', [
                {
                  text: 'Edit Copy',
                  onPress: () => navigation.replace('EditSellerProduct', { productId: newProduct.id }),
                },
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('Error duplicating product:', error);
              Alert.alert('Error', 'Failed to duplicate product');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;

              Alert.alert('Success', 'Product deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Same form fields as AddSellerProductScreen */}
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
            placeholder="Describe your product..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
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
                    style={[styles.unitButton, unit === u && styles.unitButtonActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitButtonText, unit === u && styles.unitButtonTextActive]}>
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

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, categoryId === cat.id && styles.categoryButtonActive]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.categoryButtonText, categoryId === cat.id && styles.categoryButtonTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Images Gallery */}
        <ImageGalleryManager
          images={images}
          onImagesChange={setImages}
          maxImages={5}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Farm Name</Text>
          <TextInput
            style={styles.input}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="Your farm name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Farm Location</Text>
          <TextInput
            style={styles.input}
            value={farmLocation}
            onChangeText={setFarmLocation}
            placeholder="City, State"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Organic</Text>
            <Switch
              value={isOrganic}
              onValueChange={setIsOrganic}
              trackColor={{ false: '#ccc', true: '#34A853' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Product Variants */}
        <VariantManager
          variants={variants}
          basePrice={parseFloat(price) || 0}
          onVariantsChange={setVariants}
        />

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Available for Sale</Text>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#ccc', true: '#34A853' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Duplicate Button */}
        <TouchableOpacity style={styles.duplicateButton} onPress={handleDuplicate}>
          <Text style={styles.duplicateButtonText}>Duplicate Product</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Product</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
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
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#34A853',
    borderColor: '#34A853',
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
  duplicateButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  duplicateButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
    backgroundColor: '#34A853',
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

export default EditSellerProductScreen;
