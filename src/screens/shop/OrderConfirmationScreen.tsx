import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CartStackParamList } from '../../navigation/types';
import { CheckCircle, XCircle } from 'lucide-react-native';

type OrderConfirmationScreenProps = {
  navigation: NativeStackNavigationProp<CartStackParamList, 'OrderConfirmation'>;
  route: RouteProp<CartStackParamList, 'OrderConfirmation'>;
};

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({ navigation, route }) => {
  const { orderId, orderNumber, success, errorMessage } = route.params;

  const handleContinueShopping = () => {
    navigation.navigate('CartMain');
    navigation.getParent()?.navigate('Shop', { screen: 'Home' });
  };

  const handleViewOrder = () => {
    navigation.getParent()?.navigate('Orders', { screen: 'OrderDetail', params: { orderId } });
  };

  if (!success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <XCircle size={80} color="#DC2626" strokeWidth={2} />
          </View>
          <Text style={styles.titleError}>Order Failed</Text>
          <Text style={styles.message}>
            {errorMessage || 'We encountered an issue processing your order. Please try again or contact support.'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleContinueShopping}>
            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#34A853" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
        <Text style={styles.message}>
          Your order has been placed and paid successfully. We'll notify you when it's on the way!
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You can track your order status in the Orders tab.
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrder}>
          <Text style={styles.primaryButtonText}>View Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleContinueShopping}>
          <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleError: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34A853',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#0369A1',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#34A853',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#34A853',
  },
  secondaryButtonText: {
    color: '#34A853',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OrderConfirmationScreen;
