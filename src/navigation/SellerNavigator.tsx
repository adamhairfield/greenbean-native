import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellerStackParamList } from './types';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import AddSellerProductScreen from '../screens/seller/AddSellerProductScreen';
import EditSellerProductScreen from '../screens/seller/EditSellerProductScreen';

const Stack = createNativeStackNavigator<SellerStackParamList>();

const SellerNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SellerDashboard" 
        component={SellerDashboardScreen}
        options={{ title: 'Seller Dashboard' }}
      />
      <Stack.Screen 
        name="SellerProducts" 
        component={SellerProductsScreen}
        options={{ title: 'My Products' }}
      />
      <Stack.Screen 
        name="AddSellerProduct" 
        component={AddSellerProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Stack.Screen 
        name="EditSellerProduct" 
        component={EditSellerProductScreen}
        options={{ title: 'Edit Product' }}
      />
    </Stack.Navigator>
  );
};

export default SellerNavigator;
