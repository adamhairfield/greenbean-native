import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopStackParamList } from './types';
import HomeScreen from '../screens/shop/HomeScreen';
import CategoryScreen from '../screens/shop/CategoryScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';

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
    </Stack.Navigator>
  );
};

export default ShopNavigator;
