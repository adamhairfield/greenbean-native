import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopStackParamList } from './types';
import HomeScreen from '../screens/shop/HomeScreen';
import CategoryScreen from '../screens/shop/CategoryScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';
import CartScreen from '../screens/shop/CartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import OrderConfirmationScreen from '../screens/shop/OrderConfirmationScreen';

const Stack = createNativeStackNavigator<ShopStackParamList>();

const ShopNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Greenbean Market' }}
      />
      <Stack.Screen 
        name="Category" 
        component={CategoryScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Shopping Cart' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen 
        name="OrderConfirmation" 
        component={OrderConfirmationScreen}
        options={{ title: 'Order Confirmed', headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
};

export default ShopNavigator;
