import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverStackParamList } from './types';
import { CustomBackButton } from '../components';
import DeliveryListScreen from '../screens/driver/DeliveryListScreen';
import DeliveryDetailScreen from '../screens/driver/DeliveryDetailScreen';
import DeliveryMapScreen from '../screens/driver/DeliveryMapScreen';

const Stack = createNativeStackNavigator<DriverStackParamList>();

const DriverNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="DeliveryList" 
        component={DeliveryListScreen}
        options={{ title: 'My Deliveries' }}
      />
      <Stack.Screen 
        name="DeliveryDetail" 
        component={DeliveryDetailScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen 
        name="DeliveryMap" 
        component={DeliveryMapScreen}
        options={{ title: 'Delivery Route' }}
      />
    </Stack.Navigator>
  );
};

export default DriverNavigator;
