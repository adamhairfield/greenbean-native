import React from 'react';
import { View } from 'react-native';
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
          title: 'Shopping Cart',
          headerRight: () => (
            <View style={{ marginRight: 0 }}>
              <NotificationButton 
                onPress={() => navigation.navigate('Account', { screen: 'Notifications' })} 
              />
            </View>
          ),
        }}
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
