import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShopStackParamList } from './types';
import HomeScreen from '../screens/shop/HomeScreen';
import CategoryScreen from '../screens/shop/CategoryScreen';
import ProductDetailScreen from '../screens/shop/ProductDetailScreen';
import { NotificationButton, CustomBackButton } from '../components';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<ShopStackParamList>();

const ShopNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Greenbean Market',
          headerRight: () => (
            <NotificationButton 
              onPress={() => navigation.navigate('Account', { screen: 'Notifications' })} 
            />
          ),
        }}
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
