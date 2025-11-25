import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartStackParamList } from './types';
import CartScreen from '../screens/shop/CartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import OrderConfirmationScreen from '../screens/shop/OrderConfirmationScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';

const Stack = createNativeStackNavigator<CartStackParamList>();

const CartNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CartMain" 
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
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
};

export default CartNavigator;
