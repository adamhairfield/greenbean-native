import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export interface FilterOptions {
  minPrice: number;
  maxPrice: number;
  organicOnly: boolean;
  categories: string[];
  maxDistance: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  availableCategories: { id: string; name: string }[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  availableCategories,
}) => {
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice);
  const [organicOnly, setOrganicOnly] = useState(currentFilters.organicOnly);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentFilters.categories);
  const [maxDistance, setMaxDistance] = useState(currentFilters.maxDistance);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleApply = () => {
    onApply({
      minPrice,
      maxPrice,
      organicOnly,
      categories: selectedCategories,
      maxDistance,
    });
    onClose();
  };

  const handleReset = () => {
    setMinPrice(0);
    setMaxPrice(100);
    setOrganicOnly(false);
    setSelectedCategories([]);
    setMaxDistance(50);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>${minPrice.toFixed(2)}</Text>
              <Text style={styles.priceLabel}>-</Text>
              <Text style={styles.priceLabel}>${maxPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Min</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={minPrice}
                onValueChange={setMinPrice}
                minimumTrackTintColor="#34A853"
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor="#34A853"
              />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Max</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={maxPrice}
                onValueChange={setMaxPrice}
                minimumTrackTintColor="#34A853"
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor="#34A853"
              />
            </View>
          </View>

          {/* Organic Only */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.sectionTitle}>Organic Only</Text>
                <Text style={styles.switchDescription}>Show only certified organic products</Text>
              </View>
              <Switch
                value={organicOnly}
                onValueChange={setOrganicOnly}
                trackColor={{ false: '#ccc', true: '#34A853' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category.id) && styles.categoryChipActive,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategories.includes(category.id) && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                  {selectedCategories.includes(category.id) && (
                    <Ionicons name="checkmark-circle" size={16} color="#34A853" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
            <Text style={styles.distanceValue}>{maxDistance} miles</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={maxDistance}
              onValueChange={setMaxDistance}
              minimumTrackTintColor="#34A853"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#34A853"
            />
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34A853',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34A853',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    width: 40,
  },
  slider: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34A853',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#34A853',
    fontWeight: '600',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34A853',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#34A853',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default FilterModal;
