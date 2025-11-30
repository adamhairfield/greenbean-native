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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components';

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
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

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
        setCategoryId(productData.category_id || '');
        setImageUrl(productData.image_url || '');
        setFarmName(productData.farm_name || '');
        setFarmLocation(productData.farm_location || '');
        setIsOrganic(productData.is_organic);
        setIsAvailable(productData.is_available);
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
      const { error } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          unit: unit,
          stock_quantity: parseInt(stockQuantity),
          category_id: categoryId || null,
          image_url: imageUrl.trim() || null,
          farm_name: farmName.trim() || null,
          farm_location: farmLocation.trim() || null,
          is_organic: isOrganic,
          is_available: isAvailable,
        })
        .eq('id', productId);

      if (error) throw error;

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

        <View style={styles.field}>
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

        <View style={styles.field}>
          <Text style={styles.label}>Image URL</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

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
              trackColor={{ false: '#ccc', true: '#7FAC4E' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Available for Sale</Text>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#ccc', true: '#7FAC4E' }}
              thumbColor="#fff"
            />
          </View>
        </View>

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
    backgroundColor: '#7FAC4E',
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
    backgroundColor: '#7FAC4E',
    borderColor: '#7FAC4E',
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
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
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
