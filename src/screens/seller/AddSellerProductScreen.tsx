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
import { LoadingSpinner } from '../../components';

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
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!sellerId) {
      Alert.alert('Error', 'Seller account not found');
      return;
    }

    setUploadingImage(true);

    try {
      // Get file extension
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${sellerId}/${Date.now()}.${fileExt}`;

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
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
      const { error } = await supabase.from('products').insert({
        seller_id: sellerId,
        category_id: categoryId || null,
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        unit: unit,
        stock_quantity: parseInt(stockQuantity),
        image_url: imageUrl.trim() || null,
        farm_name: farmName.trim() || null,
        farm_location: farmLocation.trim() || null,
        is_organic: isOrganic,
        is_available: isAvailable,
      });

      if (error) throw error;

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
        {/* Product Name */}
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

        {/* Description */}
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

        {/* Price and Unit */}
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

        {/* Stock Quantity */}
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

        {/* Product Image */}
        <View style={styles.field}>
          <Text style={styles.label}>Product Image</Text>
          
          {imageUrl ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUrl('')}
              >
                <Ionicons name="close-circle" size={32} color="#f44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="large" color="#7FAC4E" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={48} color="#7FAC4E" />
                  <Text style={styles.uploadButtonText}>Tap to upload image</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Switches */}
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
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7FAC4E',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7FAC4E',
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
