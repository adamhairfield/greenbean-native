import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopStackParamList } from './types';
import HomeScreen from '../screens/shop/HomeScreen';
import CategoryScreen from '../screens/shop/CategoryScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';
import { NotificationButton, CustomBackButton, HeaderLogo } from '../components';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<ShopStackParamList>();

const ShopNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
        headerShadowVisible: false,
        headerTransparent: false,
        headerBackVisible: false,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          header: () => {
            const HomeHeader = require('../components/HomeHeader').default;
            return <HomeHeader />;
          },
        }}
      />
      <Stack.Screen 
        name="Category" 
        component={CategoryScreen}
        options={({ route }) => ({
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title={route.params.categoryName} />;
          },
        })}
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

export default ShopNavigator;
