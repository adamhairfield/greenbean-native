import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellerStackParamList } from './types';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import AddSellerProductScreen from '../screens/seller/AddSellerProductScreen';
import EditSellerProductScreen from '../screens/seller/EditSellerProductScreen';
import EditSellerProfileScreen from '../screens/seller/EditSellerProfileScreen';
import { NotificationButton, CustomBackButton } from '../components';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<SellerStackParamList>();

const SellerNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="SellerDashboard" 
        component={SellerDashboardScreen}
        options={{
          header: () => {
            const HomeHeader = require('../components/HomeHeader').default;
            return <HomeHeader />;
          },
        }}
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
      <Stack.Screen 
        name="EditSellerProfile" 
        component={EditSellerProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
};

export default SellerNavigator;
