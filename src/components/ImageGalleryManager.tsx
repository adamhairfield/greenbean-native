import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export type ProductImage = {
  id?: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

interface ImageGalleryManagerProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

const ImageGalleryManager: React.FC<ImageGalleryManagerProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
}) => {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload images.'
        );
        return false;
      }
    }
    return true;
  };

  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      // Resize and compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } }, // Resize to max width of 1200px
        ],
        {
          compress: 0.8, // 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return uri; // Return original if optimization fails
    }
  };

  const pickImage = async (useCamera: boolean) => {
    if (images.length >= maxImages) {
      Alert.alert('Maximum Images', `You can only add up to ${maxImages} images.`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setUploading(true);

    try {
      let result;
      
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Optimize the image
        const optimizedUri = await optimizeImage(result.assets[0].uri);
        
        // Add the new image
        const newImage: ProductImage = {
          image_url: optimizedUri,
          is_primary: images.length === 0, // First image is primary
          sort_order: images.length,
        };

        onImagesChange([...images, newImage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onImagesChange(updated);
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = images.filter((_, i) => i !== index);
            // If we removed the primary image, make the first one primary
            if (images[index].is_primary && updated.length > 0) {
              updated[0].is_primary = true;
            }
            // Update sort orders
            updated.forEach((img, i) => {
              img.sort_order = i;
            });
            onImagesChange(updated);
          },
        },
      ]
    );
  };

  const moveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;

    const updated = [...images];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    
    // Update sort orders
    updated.forEach((img, i) => {
      img.sort_order = i;
    });
    
    onImagesChange(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Images</Text>
        <Text style={styles.subtitle}>
          {images.length}/{maxImages} images
        </Text>
      </View>

      {/* Image Gallery */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.image_url }} style={styles.image} />
            
            {/* Primary Badge */}
            {image.is_primary && (
              <View style={styles.primaryBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}

            {/* Image Controls */}
            <View style={styles.imageControls}>
              {/* Reorder Buttons */}
              <View style={styles.reorderButtons}>
                {index > 0 && (
                  <TouchableOpacity
                    onPress={() => moveImage(index, 'left')}
                    style={styles.controlButton}
                  >
                    <Ionicons name="chevron-back" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                {index < images.length - 1 && (
                  <TouchableOpacity
                    onPress={() => moveImage(index, 'right')}
                    style={styles.controlButton}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {!image.is_primary && (
                  <TouchableOpacity
                    onPress={() => setPrimaryImage(index)}
                    style={styles.controlButton}
                  >
                    <Ionicons name="star-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={[styles.controlButton, styles.deleteButton]}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Add Image Buttons */}
        {images.length < maxImages && (
          <View style={styles.addImageContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => pickImage(true)}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#34A853" />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color="#34A853" />
                  <Text style={styles.addButtonText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => pickImage(false)}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#34A853" />
              ) : (
                <>
                  <Ionicons name="images" size={32} color="#34A853" />
                  <Text style={styles.addButtonText}>Choose Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#666" />
        <Text style={styles.helpText}>
          Tap star to set primary image. Use arrows to reorder. First image shows in listings.
        </Text>
      </View>
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
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  gallery: {
    flexGrow: 0,
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34A853',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  imageControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  reorderButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: 'rgba(244,67,54,0.8)',
  },
  addImageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    gap: 12,
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 12,
    color: '#34A853',
    fontWeight: '600',
    marginTop: 4,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default ImageGalleryManager;
