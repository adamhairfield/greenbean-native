import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';

type DashboardScreenProps = NativeStackScreenProps<AdminStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const menuItems = [
    {
      title: 'Manage Sellers',
      icon: 'storefront-outline' as const,
      screen: 'ManageSellers' as const,
      description: 'Approve and manage seller accounts',
    },
    {
      title: 'Manage Products',
      icon: 'cube-outline' as const,
      screen: 'ProductManagement' as const,
      description: 'View and manage all products',
    },
    {
      title: 'Manage Orders',
      icon: 'receipt-outline' as const,
      screen: 'OrderManagement' as const,
      description: 'View and manage customer orders',
    },
    {
      title: 'Delivery Schedules',
      icon: 'calendar-outline' as const,
      screen: 'DeliverySchedules' as const,
      description: 'Manage delivery windows',
    },
    {
      title: 'Manage Drivers',
      icon: 'car-outline' as const,
      screen: 'DriverManagement' as const,
      description: 'Manage delivery drivers',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your marketplace</Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={32} color="#4CAF50" />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  menuDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;
