import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components';

type PromoCode = {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  usage_count: number;
  is_active: boolean;
  show_on_banner: boolean;
  valid_from: string;
  valid_until: string | null;
};

const PromoCodesScreen = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showOnBanner, setShowOnBanner] = useState(false);
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      Alert.alert('Error', 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo);
      setCode(promo.code);
      setDescription(promo.description || '');
      setDiscountType(promo.discount_type);
      setDiscountValue(promo.discount_value.toString());
      setMinOrderAmount(promo.min_order_amount.toString());
      setMaxDiscountAmount(promo.max_discount_amount?.toString() || '');
      setUsageLimit(promo.usage_limit?.toString() || '');
      setUsageLimitPerUser(promo.usage_limit_per_user?.toString() || '');
      setIsActive(promo.is_active);
      setShowOnBanner(promo.show_on_banner);
      setValidUntil(promo.valid_until || '');
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingPromo(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('0');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setUsageLimitPerUser('');
    setIsActive(true);
    setShowOnBanner(false);
    setValidUntil('');
  };

  const handleSave = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    try {
      const promoData = {
        code: code.toUpperCase().trim(),
        description: description.trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: parseFloat(minOrderAmount) || 0,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        usage_limit_per_user: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
        is_active: isActive,
        show_on_banner: showOnBanner,
        valid_until: validUntil || null,
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingPromo.id);

        if (error) throw error;
        Alert.alert('Success', 'Promo code updated successfully');
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert(promoData);

        if (error) throw error;
        Alert.alert('Success', 'Promo code created successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      Alert.alert('Error', error.message || 'Failed to save promo code');
    }
  };

  const handleDelete = (promo: PromoCode) => {
    Alert.alert(
      'Delete Promo Code',
      `Are you sure you want to delete "${promo.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('promo_codes')
                .delete()
                .eq('id', promo.id);

              if (error) throw error;
              Alert.alert('Success', 'Promo code deleted');
              fetchPromoCodes();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete promo code');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading promo codes..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Promo Codes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Promo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {promoCodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Tag size={48} color="#ccc" />
            <Text style={styles.emptyText}>No promo codes yet</Text>
            <Text style={styles.emptySubtext}>Create your first promo code to get started</Text>
          </View>
        ) : (
          promoCodes.map((promo) => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <View style={styles.promoCodeBadge}>
                  <Text style={styles.promoCodeText}>{promo.code}</Text>
                </View>
                <View style={styles.promoActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openModal(promo)}
                  >
                    <Edit2 size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(promo)}
                  >
                    <Trash2 size={18} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>

              {promo.description && (
                <Text style={styles.promoDescription}>{promo.description}</Text>
              )}

              <View style={styles.promoDetails}>
                <Text style={styles.promoDetailText}>
                  Discount: {promo.discount_type === 'percentage' 
                    ? `${promo.discount_value}%` 
                    : `$${promo.discount_value.toFixed(2)}`}
                </Text>
                {promo.min_order_amount > 0 && (
                  <Text style={styles.promoDetailText}>
                    Min Order: ${promo.min_order_amount.toFixed(2)}
                  </Text>
                )}
                {promo.usage_limit && (
                  <Text style={styles.promoDetailText}>
                    Usage: {promo.usage_count}/{promo.usage_limit}
                  </Text>
                )}
              </View>

              <View style={styles.promoFooter}>
                <View style={[styles.statusBadge, promo.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.statusText, promo.is_active ? styles.activeText : styles.inactiveText]}>
                    {promo.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                {promo.valid_until && (
                  <Text style={styles.expiryText}>
                    Expires: {new Date(promo.valid_until).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Promo Code *</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="SUMMER2024"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Summer sale discount"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Type *</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[styles.segment, discountType === 'percentage' && styles.segmentActive]}
                    onPress={() => setDiscountType('percentage')}
                  >
                    <Text style={[styles.segmentText, discountType === 'percentage' && styles.segmentTextActive]}>
                      Percentage
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.segment, discountType === 'fixed' && styles.segmentActive]}
                    onPress={() => setDiscountType('fixed')}
                  >
                    <Text style={[styles.segmentText, discountType === 'fixed' && styles.segmentTextActive]}>
                      Fixed Amount
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Discount Value * {discountType === 'percentage' ? '(%)' : '($)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  placeholder={discountType === 'percentage' ? '10' : '5.00'}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Minimum Order Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={minOrderAmount}
                  onChangeText={setMinOrderAmount}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>

              {discountType === 'percentage' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Max Discount Amount ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={maxDiscountAmount}
                    onChangeText={setMaxDiscountAmount}
                    placeholder="Optional"
                    keyboardType="decimal-pad"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Total Usage Limit</Text>
                <TextInput
                  style={styles.input}
                  value={usageLimit}
                  onChangeText={setUsageLimit}
                  placeholder="Unlimited"
                  keyboardType="number-pad"
                />
                <Text style={styles.helpText}>Total times this code can be used by all users</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Usage Limit Per User</Text>
                <TextInput
                  style={styles.input}
                  value={usageLimitPerUser}
                  onChangeText={setUsageLimitPerUser}
                  placeholder="Unlimited"
                  keyboardType="number-pad"
                />
                <Text style={styles.helpText}>Times each user can use this code</Text>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Active</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#ccc', true: '#B8D49A' }}
                    thumbColor={isActive ? '#34A853' : '#f4f3f4'}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Text style={styles.label}>Show on Home Banner</Text>
                    <Text style={styles.helpText}>Display this promo on the home screen</Text>
                  </View>
                  <Switch
                    value={showOnBanner}
                    onValueChange={setShowOnBanner}
                    trackColor={{ false: '#ccc', true: '#B8D49A' }}
                    thumbColor={showOnBanner ? '#34A853' : '#f4f3f4'}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingPromo ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34A853',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  promoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoCodeBadge: {
    backgroundColor: '#34A853',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  promoCodeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  promoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  promoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  promoDetailText: {
    fontSize: 13,
    color: '#333',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#2E7D32',
  },
  inactiveText: {
    color: '#C62828',
  },
  expiryText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f5f5f5',
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#34A853',
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#34A853',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PromoCodesScreen;
