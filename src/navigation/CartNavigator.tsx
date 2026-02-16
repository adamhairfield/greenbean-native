import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartStackParamList } from './types';
import CartScreen from '../screens/shop/CartScreen';
import CheckoutScreen from '../screens/shop/CheckoutScreen';
import OrderConfirmationScreen from '../screens/shop/OrderConfirmationScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';
import { NotificationButton, CustomBackButton } from '../components';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<CartStackParamList>();

const CartNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="CartMain" 
        component={CartScreen}
        options={{
          header: () => {
            const HomeHeader = require('../components/HomeHeader').default;
            return <HomeHeader />;
          },
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title="Checkout" />;
          },
        }}
      />
      <Stack.Screen 
        name="OrderConfirmation" 
        component={OrderConfirmationScreen}
        options={{
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title="Order Confirmed" />;
          },
        }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title="Product Details" />;
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default CartNavigator;
