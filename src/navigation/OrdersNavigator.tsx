import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersStackParamList } from './types';
import OrdersListScreen from '../screens/orders/OrdersListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';
import { NotificationButton, CustomBackButton } from '../components';
import { useNavigation } from '@react-navigation/native';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

const OrdersNavigator = () => {
  const navigation = useNavigation<any>();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersListScreen}
        options={{
          header: () => {
            const HomeHeader = require('../components/HomeHeader').default;
            return <HomeHeader />;
          },
        }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title="Order Details" />;
          },
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          header: () => {
            const StandardHeader = require('../components/StandardHeader').default;
            return <StandardHeader title="Notifications" />;
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default OrdersNavigator;
