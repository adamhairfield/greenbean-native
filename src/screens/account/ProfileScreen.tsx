import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle2, Mail, Phone, ShieldCheck, MapPin, Heart, Bell, Settings, Store, ChevronRight, LogOut } from 'lucide-react-native';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<AccountStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { profile, user, signOut, isRole } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <UserCircle2 size={100} color="#7FAC4E" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Mail size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        {profile?.phone && (
          <View style={styles.infoRow}>
            <Phone size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <ShieldCheck size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{profile?.role}</Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {/* Only show Delivery Addresses and Favorites for customer accounts */}
        {!isRole(['master', 'admin', 'driver', 'seller']) && (
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Addresses')}
            >
              <MapPin size={24} color="#7FAC4E" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Delivery Addresses</Text>
                <Text style={styles.menuItemSubtitle}>Manage your delivery locations</Text>
              </View>
              <ChevronRight size={24} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('Favorites')}
            >
              <Heart size={24} color="#7FAC4E" />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Favorites</Text>
                <Text style={styles.menuItemSubtitle}>Your saved products</Text>
              </View>
              <ChevronRight size={24} color="#999" />
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Bell size={24} color="#7FAC4E" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Notification Settings</Text>
            <Text style={styles.menuItemSubtitle}>Manage your notification preferences</Text>
          </View>
          <ChevronRight size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Become a Seller Button - Only show for customer accounts */}
      {!isRole(['master', 'admin', 'driver', 'seller']) && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.becomeSellerButton} 
            onPress={() => navigation.navigate('BecomeSeller')}
          >
            <Store size={24} color="#7FAC4E" />
            <View style={styles.becomeSellerContent}>
              <Text style={styles.becomeSellerTitle}>Become a Seller</Text>
              <Text style={styles.becomeSellerSubtitle}>
                Start selling your farm-fresh products
              </Text>
            </View>
            <ChevronRight size={24} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#7FAC4E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  becomeSellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7FAC4E',
  },
  becomeSellerContent: {
    flex: 1,
    marginLeft: 12,
  },
  becomeSellerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  becomeSellerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ProfileScreen;
