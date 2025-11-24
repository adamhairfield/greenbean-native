import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountStackParamList } from './types';
import ProfileScreen from '../screens/account/ProfileScreen';
import EditProfileScreen from '../screens/account/EditProfileScreen';
import AddressesScreen from '../screens/account/AddressesScreen';
import AddAddressScreen from '../screens/account/AddAddressScreen';
import EditAddressScreen from '../screens/account/EditAddressScreen';
import FavoritesScreen from '../screens/account/FavoritesScreen';
import SettingsScreen from '../screens/account/SettingsScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

const AccountNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'My Account' }}
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
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default AccountNavigator;
