import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrdersStackParamList } from './types';
import OrdersListScreen from '../screens/orders/OrdersListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
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
          title: 'My Orders',
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
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
    </Stack.Navigator>
  );
};

export default OrdersNavigator;
