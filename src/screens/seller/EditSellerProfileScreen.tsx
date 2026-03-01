import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SellerStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Camera, X, Plus } from 'lucide-react-native';

type EditSellerProfileScreenProps = NativeStackScreenProps<SellerStackParamList, 'EditSellerProfile'>;

const EditSellerProfileScreen: React.FC<EditSellerProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellerId, setSellerId] = useState<string>('');

  // Basic Info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Profile Fields
  const [farmStory, setFarmStory] = useState('');
  const [growingPractices, setGrowingPractices] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [visitingHours, setVisitingHours] = useState('');
  const [acceptsFarmVisits, setAcceptsFarmVisits] = useState(false);

  // Images
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Arrays
  const [certifications, setCertifications] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Social Media
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  const fetchSellerProfile = async () => {
    try {
      const { data: sellerData, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (sellerData) {
        setSellerId(sellerData.id);
        setBusinessName(sellerData.business_name || '');
        setBusinessDescription(sellerData.business_description || '');
        setBusinessAddress(sellerData.business_address || '');
        setBusinessPhone(sellerData.business_phone || '');
        setBusinessEmail(sellerData.business_email || '');
        setFarmStory(sellerData.farm_story || '');
        setGrowingPractices(sellerData.growing_practices || '');
        setFarmSize(sellerData.farm_size || '');
        setEstablishedYear(sellerData.established_year?.toString() || '');
        setWebsiteUrl(sellerData.website_url || '');
        setPublicEmail(sellerData.public_email || '');
        setPublicPhone(sellerData.public_phone || '');
        setVisitingHours(sellerData.visiting_hours || '');
        setAcceptsFarmVisits(sellerData.accepts_farm_visits || false);
        setProfileImageUrl(sellerData.profile_image_url || '');
        setCoverImageUrl(sellerData.cover_image_url || '');
        setCertifications(sellerData.certifications || []);
        setSpecialties(sellerData.specialties || []);

        const socialMedia = sellerData.social_media as any || {};
        setInstagram(socialMedia.instagram || '');
        setFacebook(socialMedia.facebook || '');
        setTwitter(socialMedia.twitter || '');
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'profile' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri: string, type: 'profile' | 'cover') => {
    try {
      if (type === 'profile') {
        setUploadingProfile(true);
      } else {
        setUploadingCover(true);
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${sellerId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `seller-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (type === 'profile') {
        setProfileImageUrl(publicUrl);
      } else {
        setCoverImageUrl(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      if (type === 'profile') {
        setUploadingProfile(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setSaving(true);
    try {
      const socialMedia = {
        instagram: instagram || null,
        facebook: facebook || null,
        twitter: twitter || null,
      };

      const { error } = await supabase
        .from('sellers')
        .update({
          business_name: businessName,
          business_description: businessDescription || null,
          business_address: businessAddress || null,
          business_phone: businessPhone || null,
          business_email: businessEmail || null,
          farm_story: farmStory || null,
          growing_practices: growingPractices || null,
          farm_size: farmSize || null,
          established_year: establishedYear ? parseInt(establishedYear) : null,
          website_url: websiteUrl || null,
          public_email: publicEmail || null,
          public_phone: publicPhone || null,
          visiting_hours: visitingHours || null,
          accepts_farm_visits: acceptsFarmVisits,
          profile_image_url: profileImageUrl || null,
          cover_image_url: coverImageUrl || null,
          certifications: certifications.length > 0 ? certifications : null,
          specialties: specialties.length > 0 ? specialties : null,
          social_media: socialMedia,
        })
        .eq('id', sellerId);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34A853" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Cover Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Image</Text>
          <TouchableOpacity
            style={styles.imageUploadContainer}
            onPress={() => pickImage('cover')}
          >
            {coverImageUrl ? (
              <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={32} color="#999" />
                <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
              </View>
            )}
            {uploadingCover && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Image</Text>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={() => pickImage('profile')}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Camera size={32} color="#999" />
              </View>
            )}
            {uploadingProfile && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your Farm Name"
          />

          <Text style={styles.label}>Business Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={businessDescription}
            onChangeText={setBusinessDescription}
            placeholder="Brief description of your business"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={styles.input}
            value={businessAddress}
            onChangeText={setBusinessAddress}
            placeholder="123 Farm Road, City, State"
          />

          <Text style={styles.label}>Business Phone</Text>
          <TextInput
            style={styles.input}
            value={businessPhone}
            onChangeText={setBusinessPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Business Email</Text>
          <TextInput
            style={styles.input}
            value={businessEmail}
            onChangeText={setBusinessEmail}
            placeholder="business@farm.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Farm Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Story</Text>
          <Text style={styles.helpText}>Tell customers about your farm's history and philosophy</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={farmStory}
            onChangeText={setFarmStory}
            placeholder="Share your farm's story..."
            multiline
            numberOfLines={5}
          />
        </View>

        {/* Growing Practices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growing Practices</Text>
          <Text style={styles.helpText}>Describe your farming methods and sustainability practices</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={growingPractices}
            onChangeText={setGrowingPractices}
            placeholder="Describe your growing practices..."
            multiline
            numberOfLines={5}
          />
        </View>

        {/* Farm Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Details</Text>
          
          <Text style={styles.label}>Farm Size</Text>
          <TextInput
            style={styles.input}
            value={farmSize}
            onChangeText={setFarmSize}
            placeholder="e.g., 5 acres, 20 hectares"
          />

          <Text style={styles.label}>Established Year</Text>
          <TextInput
            style={styles.input}
            value={establishedYear}
            onChangeText={setEstablishedYear}
            placeholder="e.g., 2010"
            keyboardType="number-pad"
          />
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              value={newCertification}
              onChangeText={setNewCertification}
              placeholder="e.g., USDA Organic"
            />
            <TouchableOpacity style={styles.addButton} onPress={addCertification}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {certifications.map((cert, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{cert}</Text>
                <TouchableOpacity onPress={() => removeCertification(index)}>
                  <X size={16} color="#34A853" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              value={newSpecialty}
              onChangeText={setNewSpecialty}
              placeholder="e.g., Heirloom Tomatoes"
            />
            <TouchableOpacity style={styles.addButton} onPress={addSpecialty}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {specialties.map((specialty, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{specialty}</Text>
                <TouchableOpacity onPress={() => removeSpecialty(index)}>
                  <X size={16} color="#34A853" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public Contact Information</Text>
          <Text style={styles.helpText}>This will be visible to customers on your profile</Text>
          
          <Text style={styles.label}>Public Email</Text>
          <TextInput
            style={styles.input}
            value={publicEmail}
            onChangeText={setPublicEmail}
            placeholder="contact@farm.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Public Phone</Text>
          <TextInput
            style={styles.input}
            value={publicPhone}
            onChangeText={setPublicPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://yourfarm.com"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Farm Visits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Visits</Text>
          
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptsFarmVisits(!acceptsFarmVisits)}
          >
            <View style={[styles.checkbox, acceptsFarmVisits && styles.checkboxChecked]}>
              {acceptsFarmVisits && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>We accept farm visits</Text>
          </TouchableOpacity>

          {acceptsFarmVisits && (
            <>
              <Text style={styles.label}>Visiting Hours</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={visitingHours}
                onChangeText={setVisitingHours}
                placeholder="e.g., Saturdays 10am-4pm, by appointment"
                multiline
                numberOfLines={2}
              />
            </>
          )}
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholder="https://instagram.com/yourfarm"
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            value={facebook}
            onChangeText={setFacebook}
            placeholder="https://facebook.com/yourfarm"
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Twitter</Text>
          <TextInput
            style={styles.input}
            value={twitter}
            onChangeText={setTwitter}
            placeholder="https://twitter.com/yourfarm"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addItemInput: {
    flex: 1,
    marginTop: 0,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#34A853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#34A853',
  },
  chipText: {
    fontSize: 14,
    color: '#34A853',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#34A853',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34A853',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#34A853',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default EditSellerProfileScreen;
