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
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerTitle: '',
          headerLeft: () => (
            <View style={{ marginLeft: 0 }}>
              <HeaderLogo />
            </View>
          ),
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
