import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from './types';
import ProfileScreen from '../screens/account/ProfileScreen';
import EditProfileScreen from '../screens/account/EditProfileScreen';
import AddressesScreen from '../screens/account/AddressesScreen';
import AddAddressScreen from '../screens/account/AddAddressScreen';
import EditAddressScreen from '../screens/account/EditAddressScreen';
import FavoritesScreen from '../screens/account/FavoritesScreen';
import NotificationsScreen from '../screens/account/NotificationsScreen';
import NotificationSettingsScreen from '../screens/account/NotificationSettingsScreen';
import SettingsScreen from '../screens/account/SettingsScreen';
import BecomeSellerScreen from '../screens/seller/BecomeSellerScreen';
import SellerOnboardingStatusScreen from '../screens/seller/SellerOnboardingStatusScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import { NotificationButton, CustomBackButton } from '../components';
import { TouchableOpacity, View } from 'react-native';
import { MoreVertical } from 'lucide-react-native';

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'My Account',
          headerRight: () => (
            <View style={{ marginRight: 16, backgroundColor: 'transparent' }}>
              <NotificationButton onPress={() => navigation.navigate('Notifications')} />
            </View>
          ),
        })}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen 
        name="Addresses" 
        component={AddressesScreen}
        options={{ title: 'Delivery Addresses' }}
      />
      <Stack.Screen 
        name="AddAddress" 
        component={AddAddressScreen}
        options={{ title: 'Add Address' }}
      />
      <Stack.Screen 
        name="EditAddress" 
        component={EditAddressScreen}
        options={{ title: 'Edit Address' }}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={({ navigation }) => ({
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationSettings')}
              style={{ marginRight: 16 }}
            >
              <MoreVertical size={24} color="#333" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="BecomeSeller" 
        component={BecomeSellerScreen}
        options={{ title: 'Become a Seller' }}
      />
      <Stack.Screen 
        name="SellerOnboardingStatus" 
        component={SellerOnboardingStatusScreen}
        options={{ title: 'Onboarding Status' }}
      />
    </Stack.Navigator>
  );
};

export default AccountNavigator;
