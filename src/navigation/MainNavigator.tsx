import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import ShopNavigator from './ShopNavigator';
import CartNavigator from './CartNavigator';
import OrdersNavigator from './OrdersNavigator';
import AccountNavigator from './AccountNavigator';
import SellerNavigator from './SellerNavigator';
import DriverNavigator from './DriverNavigator';
import AdminNavigator from './AdminNavigator';
import AnalyticsNavigator from './AnalyticsNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  const { isRole } = useAuth();
  const { itemCount } = useCart();

  const isMasterAdmin = isRole(['master']);
  const isSeller = isRole(['seller']);
  const isDriver = isRole(['driver']);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999',
      }}
    >
      {/* Hide Shop and Cart for master admins, sellers, and drivers */}
      {!isMasterAdmin && !isSeller && !isDriver && (
        <>
          <Tab.Screen
            name="Shop"
            component={ShopNavigator}
            options={{
              tabBarLabel: 'Shop',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="storefront-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Cart"
            component={CartNavigator}
            options={{
              tabBarLabel: 'Cart',
              tabBarIcon: ({ color, size }) => (
                <View>
                  <Ionicons name="cart-outline" size={size} color={color} />
                  {itemCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{itemCount}</Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />
        </>
      )}
      {/* Show Orders for everyone - master admins see all orders, others see their own */}
      <Tab.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size}) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      {isRole(['seller', 'admin']) && !isMasterAdmin && (
        <Tab.Screen
          name="Seller"
          component={SellerNavigator}
          options={{
            tabBarLabel: 'Sell',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {isRole(['driver', 'admin', 'master']) && (
        <Tab.Screen
          name="Driver"
          component={DriverNavigator}
          options={{
            tabBarLabel: 'Deliveries',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {isRole(['admin', 'master']) && (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          options={{
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      {isMasterAdmin && (
        <Tab.Screen
          name="Analytics"
          component={AnalyticsNavigator}
          options={{
            tabBarLabel: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Account"
        component={AccountNavigator}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
