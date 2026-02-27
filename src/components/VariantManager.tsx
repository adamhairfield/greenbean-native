import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ProductVariant = {
  id?: string;
  variant_name: string;
  variant_type: 'size' | 'packaging' | 'quality' | 'custom';
  price_adjustment: number;
  price_override: number | null;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_default: boolean;
  sort_order: number;
};

interface VariantManagerProps {
  variants: ProductVariant[];
  basePrice: number;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

const VARIANT_TYPES = [
  { value: 'size', label: 'Size', icon: 'resize-outline' },
  { value: 'packaging', label: 'Packaging', icon: 'cube-outline' },
  { value: 'quality', label: 'Quality', icon: 'star-outline' },
  { value: 'custom', label: 'Custom', icon: 'create-outline' },
];

const VariantManager: React.FC<VariantManagerProps> = ({
  variants,
  basePrice,
  onVariantsChange,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addVariant = () => {
    const newVariant: ProductVariant = {
      variant_name: '',
      variant_type: 'size',
      price_adjustment: 0,
      price_override: null,
      sku: '',
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_available: true,
      is_default: variants.length === 0,
      sort_order: variants.length,
    };
    onVariantsChange([...variants, newVariant]);
    setExpandedIndex(variants.length);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...updates };
    
    // If setting as default, unset others
    if (updates.is_default) {
      updated.forEach((v, i) => {
        if (i !== index) v.is_default = false;
      });
    }
    
    onVariantsChange(updated);
  };

  const removeVariant = (index: number) => {
    Alert.alert(
      'Remove Variant',
      'Are you sure you want to remove this variant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = variants.filter((_, i) => i !== index);
            // If removed variant was default, make first one default
            if (variants[index].is_default && updated.length > 0) {
              updated[0].is_default = true;
            }
            onVariantsChange(updated);
            setExpandedIndex(null);
          },
        },
      ]
    );
  };

  const getEffectivePrice = (variant: ProductVariant) => {
    if (variant.price_override !== null) {
      return variant.price_override;
    }
    return basePrice + variant.price_adjustment;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Variants</Text>
        <TouchableOpacity onPress={addVariant} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#34A853" />
          <Text style={styles.addButtonText}>Add Variant</Text>
        </TouchableOpacity>
      </View>

      {variants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="layers-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No variants yet</Text>
          <Text style={styles.emptySubtext}>
            Add variants for different sizes, packaging, or quality tiers
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.variantsList}>
          {variants.map((variant, index) => (
            <View key={index} style={styles.variantCard}>
              <TouchableOpacity
                style={styles.variantHeader}
                onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <View style={styles.variantHeaderLeft}>
                  <Ionicons
                    name={VARIANT_TYPES.find(t => t.value === variant.variant_type)?.icon as any || 'cube-outline'}
                    size={20}
                    color="#34A853"
                  />
                  <View style={styles.variantHeaderInfo}>
                    <Text style={styles.variantName}>
                      {variant.variant_name || 'Unnamed Variant'}
                    </Text>
                    <Text style={styles.variantPrice}>
                      ${getEffectivePrice(variant).toFixed(2)}
                      {variant.is_default && <Text style={styles.defaultBadge}> • Default</Text>}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedIndex === index && (
                <View style={styles.variantBody}>
                  {/* Variant Name */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Variant Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={variant.variant_name}
                      onChangeText={(text) => updateVariant(index, { variant_name: text })}
                      placeholder="e.g., Small, 1lb Bag, Premium"
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Variant Type */}
                  <View style={styles.field}>
                    <Text style={styles.label}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {VARIANT_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[
                            styles.typeButton,
                            variant.variant_type === type.value && styles.typeButtonActive,
                          ]}
                          onPress={() => updateVariant(index, { variant_type: type.value as any })}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              variant.variant_type === type.value && styles.typeButtonTextActive,
                            ]}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Pricing */}
                  <View style={styles.row}>
                    <View style={[styles.field, styles.flex1]}>
                      <Text style={styles.label}>Price Adjustment</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.price_adjustment.toString()}
                        onChangeText={(text) => updateVariant(index, { price_adjustment: parseFloat(text) || 0 })}
                        placeholder="0.00"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.hint}>+/- from base price</Text>
                    </View>
                    <View style={[styles.field, styles.flex1, styles.marginLeft]}>
                      <Text style={styles.label}>Override Price</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.price_override?.toString() || ''}
                        onChangeText={(text) => updateVariant(index, { price_override: text ? parseFloat(text) : null })}
                        placeholder="Optional"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.hint}>Set absolute price</Text>
                    </View>
                  </View>

                  {/* Stock */}
                  <View style={styles.row}>
                    <View style={[styles.field, styles.flex1]}>
                      <Text style={styles.label}>Stock</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.stock_quantity.toString()}
                        onChangeText={(text) => updateVariant(index, { stock_quantity: parseInt(text) || 0 })}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={[styles.field, styles.flex1, styles.marginLeft]}>
                      <Text style={styles.label}>Low Stock Alert</Text>
                      <TextInput
                        style={styles.input}
                        value={variant.low_stock_threshold.toString()}
                        onChangeText={(text) => updateVariant(index, { low_stock_threshold: parseInt(text) || 5 })}
                        placeholder="5"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  {/* SKU */}
                  <View style={styles.field}>
                    <Text style={styles.label}>SKU (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={variant.sku}
                      onChangeText={(text) => updateVariant(index, { sku: text })}
                      placeholder="Unique identifier"
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Toggles */}
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={styles.toggle}
                      onPress={() => updateVariant(index, { is_default: !variant.is_default })}
                    >
                      <Ionicons
                        name={variant.is_default ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={variant.is_default ? '#34A853' : '#999'}
                      />
                      <Text style={styles.toggleText}>Set as Default</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.toggle}
                      onPress={() => updateVariant(index, { is_available: !variant.is_available })}
                    >
                      <Ionicons
                        name={variant.is_available ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={variant.is_available ? '#34A853' : '#999'}
                      />
                      <Text style={styles.toggleText}>Available</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeVariant(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#f44336" />
                    <Text style={styles.removeButtonText}>Remove Variant</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34A853',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  variantsList: {
    maxHeight: 400,
  },
  variantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  variantHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  variantHeaderInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 14,
    color: '#34A853',
    fontWeight: '500',
  },
  defaultBadge: {
    color: '#666',
    fontSize: 12,
  },
  variantBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
    fontSize: 15,
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#34A853',
    borderColor: '#34A853',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    backgroundColor: '#fff',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
});

export default VariantManager;
