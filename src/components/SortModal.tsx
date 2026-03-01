import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 
  | 'newest'
  | 'price_low'
  | 'price_high'
  | 'popularity'
  | 'name_az'
  | 'name_za';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: SortOption) => void;
  currentSort: SortOption;
}

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: 'newest', label: 'Newest First', icon: 'time-outline' },
  { value: 'price_low', label: 'Price: Low to High', icon: 'arrow-up-outline' },
  { value: 'price_high', label: 'Price: High to Low', icon: 'arrow-down-outline' },
  { value: 'popularity', label: 'Most Popular', icon: 'trending-up-outline' },
  { value: 'name_az', label: 'Name: A to Z', icon: 'text-outline' },
  { value: 'name_za', label: 'Name: Z to A', icon: 'text-outline' },
];

const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentSort,
}) => {
  const handleSelect = (option: SortOption) => {
    onSelect(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort By</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  currentSort === option.value && styles.optionActive,
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={currentSort === option.value ? '#34A853' : '#666'} 
                />
                <Text
                  style={[
                    styles.optionText,
                    currentSort === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {currentSort === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#34A853" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    gap: 12,
  },
  optionActive: {
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionTextActive: {
    color: '#34A853',
    fontWeight: '600',
  },
});

export default SortModal;
