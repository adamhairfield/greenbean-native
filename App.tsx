import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RecentlyViewedProvider } from './src/contexts/RecentlyViewedContext';
import RootNavigator from './src/navigation/RootNavigator';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <AuthProvider>
            <NotificationProvider>
              <FavoritesProvider>
                <RecentlyViewedProvider>
                  <CartProvider>
                    <RootNavigator />
                    <StatusBar style="auto" />
                  </CartProvider>
                </RecentlyViewedProvider>
              </FavoritesProvider>
            </NotificationProvider>
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
