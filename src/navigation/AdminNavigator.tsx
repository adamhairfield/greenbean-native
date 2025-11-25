import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from './types';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import EditProductScreen from '../screens/admin/EditProductScreen';
import OrderManagementScreen from '../screens/admin/OrderManagementScreen';
import DriverManagementScreen from '../screens/admin/DriverManagementScreen';
import ManageSellersScreen from '../screens/admin/ManageSellersScreen';
import DeliverySchedulesScreen from '../screens/admin/DeliverySchedulesScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="ProductManagement" 
        component={ProductManagementScreen}
        options={{ title: 'Manage Products' }}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen 
        name="OrderManagement" 
        component={OrderManagementScreen}
        options={{ title: 'Manage Orders' }}
      />
      <Stack.Screen 
        name="DriverManagement" 
        component={DriverManagementScreen}
        options={{ title: 'Manage Drivers' }}
      />
      <Stack.Screen 
        name="ManageSellers" 
        component={ManageSellersScreen}
        options={{ title: 'Manage Sellers' }}
      />
      <Stack.Screen 
        name="DeliverySchedules" 
        component={DeliverySchedulesScreen}
        options={{ title: 'Delivery Schedules' }}
      />
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
