import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShopStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { LoadingSpinner } from '../../components';
import { MapPin, Phone, Mail, Globe, Calendar, Award, Leaf, Users, ExternalLink } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

type Seller = Database['public']['Tables']['sellers']['Row'];
type SellerPhoto = Database['public']['Tables']['seller_photos']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

type SellerProfileScreenProps = NativeStackScreenProps<ShopStackParamList, 'SellerProfile'>;

const { width } = Dimensions.get('window');

const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({ route, navigation }) => {
  const { sellerId } = route.params;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [photos, setPhotos] = useState<SellerPhoto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId]);

  const fetchSellerProfile = async () => {
    try {
      // Fetch seller details
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .eq('is_active', true)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch seller photos
      const { data: photosData } = await supabase
        .from('seller_photos')
        .select('*')
        .eq('seller_id', sellerId)
        .order('display_order', { ascending: true });

      setPhotos(photosData || []);

      // Fetch seller products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_available', true)
        .limit(6);

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactPress = (type: 'email' | 'phone' | 'website') => {
    if (!seller) return;

    switch (type) {
      case 'email':
        if (seller.public_email) {
          Linking.openURL(`mailto:${seller.public_email}`);
        }
        break;
      case 'phone':
        if (seller.public_phone) {
          Linking.openURL(`tel:${seller.public_phone}`);
        }
        break;
      case 'website':
        if (seller.website_url) {
          Linking.openURL(seller.website_url);
        }
        break;
    }
  };

  const handleSocialPress = (platform: string, url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading farm profile..." />;
  }

  if (!seller) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Farm profile not found</Text>
      </View>
    );
  }

  const socialMedia = seller.social_media as any || {};

  return (
    <ScrollView style={styles.container}>
      {/* Cover Image */}
      {seller.cover_image_url ? (
        <Image source={{ uri: seller.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverImage, styles.coverImagePlaceholder]}>
          <Leaf size={64} color="#34A853" />
        </View>
      )}

      {/* Profile Header */}
      <View style={styles.header}>
        {seller.profile_image_url ? (
          <Image source={{ uri: seller.profile_image_url }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
            <Text style={styles.profileInitial}>{seller.business_name[0]}</Text>
          </View>
        )}
        <Text style={styles.businessName}>{seller.business_name}</Text>
        {seller.business_address && (
          <View style={styles.locationRow}>
            <MapPin size={16} color="#666" />
            <Text style={styles.locationText}>{seller.business_address}</Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {seller.established_year && (
          <View style={styles.statItem}>
            <Calendar size={20} color="#34A853" />
            <Text style={styles.statLabel}>Est. {seller.established_year}</Text>
          </View>
        )}
        {seller.farm_size && (
          <View style={styles.statItem}>
            <MapPin size={20} color="#34A853" />
            <Text style={styles.statLabel}>{seller.farm_size}</Text>
          </View>
        )}
        {seller.certifications && seller.certifications.length > 0 && (
          <View style={styles.statItem}>
            <Award size={20} color="#34A853" />
            <Text style={styles.statLabel}>{seller.certifications.length} Certified</Text>
          </View>
        )}
      </View>

      {/* Farm Story */}
      {seller.farm_story && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>{seller.farm_story}</Text>
        </View>
      )}

      {/* Growing Practices */}
      {seller.growing_practices && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Leaf size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Growing Practices</Text>
          </View>
          <Text style={styles.sectionText}>{seller.growing_practices}</Text>
        </View>
      )}

      {/* Certifications */}
      {seller.certifications && seller.certifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color="#34A853" />
            <Text style={styles.sectionTitle}>Certifications</Text>
          </View>
          <View style={styles.certificationsGrid}>
            {seller.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationBadge}>
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Specialties */}
      {seller.specialties && seller.specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Specialties</Text>
          <View style={styles.specialtiesGrid}>
            {seller.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <Image source={{ uri: photo.image_url }} style={styles.galleryPhoto} />
                {photo.caption && <Text style={styles.photoCaption}>{photo.caption}</Text>}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products */}
      {products.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              >
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text style={styles.productEmoji}>🥬</Text>
                  </View>
                )}
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>
                  ${product.price.toFixed(2)}/{product.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Contact Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={24} color="#34A853" />
          <Text style={styles.sectionTitle}>Get in Touch</Text>
        </View>

        {seller.public_email && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactPress('email')}
          >
            <Mail size={20} color="#34A853" />
            <Text style={styles.contactButtonText}>{seller.public_email}</Text>
          </TouchableOpacity>
        )}

        {seller.public_phone && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactPress('phone')}
          >
            <Phone size={20} color="#34A853" />
            <Text style={styles.contactButtonText}>{seller.public_phone}</Text>
          </TouchableOpacity>
        )}

        {seller.website_url && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactPress('website')}
          >
            <Globe size={20} color="#34A853" />
            <Text style={styles.contactButtonText}>Visit Website</Text>
            <ExternalLink size={16} color="#34A853" />
          </TouchableOpacity>
        )}

        {seller.visiting_hours && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Visiting Hours</Text>
            <Text style={styles.infoText}>{seller.visiting_hours}</Text>
            {seller.accepts_farm_visits && (
              <Text style={styles.infoNote}>Farm visits welcome!</Text>
            )}
          </View>
        )}

        {/* Social Media */}
        {Object.keys(socialMedia).length > 0 && (
          <View style={styles.socialContainer}>
            <Text style={styles.socialTitle}>Follow Us</Text>
            <View style={styles.socialButtons}>
              {socialMedia.instagram && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('instagram', socialMedia.instagram)}
                >
                  <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                </TouchableOpacity>
              )}
              {socialMedia.facebook && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('facebook', socialMedia.facebook)}
                >
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
              )}
              {socialMedia.twitter && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialPress('twitter', socialMedia.twitter)}
                >
                  <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  coverImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -50,
    backgroundColor: '#e0e0e0',
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34A853',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  certificationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34A853',
  },
  certificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    color: '#666',
  },
  photoGallery: {
    marginTop: 12,
  },
  photoContainer: {
    marginRight: 12,
  },
  galleryPhoto: {
    width: 250,
    height: 180,
    borderRadius: 12,
  },
  photoCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    maxWidth: 250,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 48,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34A853',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  contactButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34A853',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  infoNote: {
    fontSize: 12,
    color: '#34A853',
    marginTop: 8,
    fontStyle: 'italic',
  },
  socialContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});

export default SellerProfileScreen;
