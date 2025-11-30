import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { LoadingSpinner } from '../../components';

type DeliverySchedule = Database['public']['Tables']['delivery_schedules']['Row'];

const DeliverySchedulesScreen = () => {
  const [schedules, setSchedules] = useState<DeliverySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DeliverySchedule | null>(null);

  // Form state
  const [deliveryDay, setDeliveryDay] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>('tuesday');
  const [cutoffDaysBefore, setCutoffDaysBefore] = useState('2');
  const [maxOrders, setMaxOrders] = useState('50');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('Error', 'Failed to load delivery schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setDeliveryDay('tuesday');
    setCutoffDaysBefore('2');
    setMaxOrders('50');
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (schedule: DeliverySchedule) => {
    // For now, editing is disabled for recurring schedules
    // You would need to add day_of_week field to the database
    Alert.alert('Edit Schedule', 'Editing recurring schedules coming soon');
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .insert({
          day_of_week: deliveryDay,
          cutoff_days_before: parseInt(cutoffDaysBefore) || 2,
          max_orders: parseInt(maxOrders) || 50,
          is_active: isActive,
        });

      if (error) throw error;
      Alert.alert('Success', 'Recurring delivery schedule created');

      setModalVisible(false);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', error.message || 'Failed to save schedule');
    }
  };

  const handleDelete = (schedule: DeliverySchedule) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this delivery schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('delivery_schedules')
                .delete()
                .eq('id', schedule.id);

              if (error) throw error;
              Alert.alert('Success', 'Schedule deleted');
              fetchSchedules();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  if (loading) {
    return <LoadingSpinner message="Loading schedules..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Delivery Schedules</Text>
            <Text style={styles.emptyText}>
              Create delivery windows for customers to choose from
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleDate}>
                  Every {getDayLabel(item.day_of_week)}
                </Text>
                <Text style={styles.scheduleWindow}>
                  Recurring Weekly
                </Text>
              </View>
              <View style={styles.scheduleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.scheduleDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Orders close {item.cutoff_days_before} days before
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Max {item.max_orders || 0} orders per delivery
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons
                  name={item.is_active ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={item.is_active ? '#7FAC4E' : '#f44336'}
                />
                <Text style={styles.detailText}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Schedule</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
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
                {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.field}>
                <Text style={styles.label}>Delivery Day *</Text>
                <Text style={styles.fieldDescription}>Deliveries will repeat every week on this day</Text>
                <View style={styles.dayButtons}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        deliveryDay === day && styles.dayButtonActive,
                      ]}
                      onPress={() => setDeliveryDay(day as any)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          deliveryDay === day && styles.dayButtonTextActive,
                        ]}
                      >
                        {day.slice(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Cutoff Days Before *</Text>
                <Text style={styles.fieldDescription}>Orders close this many days before delivery</Text>
                <TextInput
                  style={styles.input}
                  value={cutoffDaysBefore}
                  onChangeText={setCutoffDaysBefore}
                  placeholder="2"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>


              <View style={styles.field}>
                <Text style={styles.label}>Max Orders</Text>
                <TextInput
                  style={styles.input}
                  value={maxOrders}
                  onChangeText={setMaxOrders}
                  placeholder="50"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.switchField}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#ccc', true: '#B8D49A' }}
                  thumbColor={isActive ? '#7FAC4E' : '#f4f3f4'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scheduleCard: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleWindow: {
    fontSize: 14,
    color: '#7FAC4E',
    fontWeight: '500',
  },
  scheduleActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  scheduleDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#7FAC4E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  modalBody: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#7FAC4E',
    borderColor: '#7FAC4E',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: '#fff',
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
  windowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  windowButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  windowButtonActive: {
    backgroundColor: '#7FAC4E',
    borderColor: '#7FAC4E',
  },
  windowButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  windowButtonTextActive: {
    color: '#fff',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#7FAC4E',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DeliverySchedulesScreen;
