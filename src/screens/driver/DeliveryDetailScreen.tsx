import React from 'react';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DriverStackParamList } from '../../navigation/types';
import OrderDetailScreen from '../orders/OrderDetailScreen';

type DeliveryDetailScreenProps = {
  navigation: NativeStackNavigationProp<DriverStackParamList, 'DeliveryDetail'>;
  route: RouteProp<DriverStackParamList, 'DeliveryDetail'>;
};

// Reuse OrderDetailScreen for delivery details since they show the same information
// The OrderDetailScreen already handles driver role and shows update buttons
const DeliveryDetailScreen: React.FC<DeliveryDetailScreenProps> = ({ route }) => {
  return <OrderDetailScreen route={route as any} navigation={null as any} />;
};

export default DeliveryDetailScreen;
