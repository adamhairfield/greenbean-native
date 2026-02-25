import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type AddAddressScreenProps = {
  navigation: NativeStackNavigationProp<AccountStackParamList, 'AddAddress'>;
};

const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  const searchPlaces = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&types=address&components=country:us&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
      );

      const data = await response.json();

      if (data.result) {
        const components = data.result.address_components;
        let street = '';
        let cityName = '';
        let stateName = '';
        let zip = '';

        components.forEach((component: any) => {
          if (component.types.includes('street_number')) {
            street = component.long_name + ' ';
          }
          if (component.types.includes('route')) {
            street += component.long_name;
          }
          if (component.types.includes('locality')) {
            cityName = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            stateName = component.short_name;
          }
          if (component.types.includes('postal_code')) {
            zip = component.long_name;
          }
        });

        setStreetAddress(street);
        setCity(cityName);
        setState(stateName);
        setZipCode(zip);
        setShowSuggestions(false);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Failed to fetch address details');
    }
  };

  const handleAddressChange = (text: string) => {
    setStreetAddress(text);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    getPlaceDetails(suggestion.place_id);
  };

  const handleSave = async () => {
    // Validation
    if (!streetAddress.trim()) {
      Alert.alert('Error', 'Please enter a street address');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    if (!state.trim()) {
      Alert.alert('Error', 'Please enter a state');
      return;
    }
    if (!zipCode.trim()) {
      Alert.alert('Error', 'Please enter a ZIP code');
      return;
    }

    setLoading(true);

    try {
      // If this is being set as default, unset all other defaults first
      if (isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);
      }

      const { error } = await supabase.from('addresses').insert({
        user_id: user!.id,
        street_address: streetAddress.trim(),
        apartment: apartment.trim() || null,
        city: city.trim(),
        state: state.trim(),
        zip_code: zipCode.trim(),
        delivery_instructions: deliveryInstructions.trim() || null,
        is_default: isDefault,
      });

      if (error) throw error;

      Alert.alert('Success', 'Address added successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error adding address:', error);
      Alert.alert('Error', error.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.field}>
          <Text style={styles.label}>Street Address *</Text>
          <View style={styles.autocompleteContainer}>
            <TextInput
              style={styles.input}
              value={streetAddress}
              onChangeText={handleAddressChange}
              placeholder="123 Main St"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            {searchingAddress && (
              <ActivityIndicator
                style={styles.searchingIndicator}
                size="small"
                color="#34A853"
              />
            )}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView 
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Ionicons name="location-outline" size={20} color="#34A853" />
                      <Text style={styles.suggestionText}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Apartment, Suite, etc.</Text>
          <TextInput
            style={styles.input}
            value={apartment}
            onChangeText={setApartment}
            placeholder="Apt 4B"
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Burlington"
            placeholderTextColor="#999"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="VT"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          <View style={[styles.field, styles.fieldHalf]}>
            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="05401"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Delivery Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="e.g., Leave at front door, Ring doorbell"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchField}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Set as Default Address</Text>
            <Text style={styles.switchDescription}>
              This will be your primary delivery address
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: '#ccc', true: '#B8D49A' }}
            thumbColor={isDefault ? '#34A853' : '#f4f3f4'}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  autocompleteContainer: {
    position: 'relative',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#34A853',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddAddressScreen;
