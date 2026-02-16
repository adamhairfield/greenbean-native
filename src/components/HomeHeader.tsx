import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderLogo from './HeaderLogo';

const HomeHeader = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <HeaderLogo />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Account', { screen: 'Notifications' })}
          style={styles.bellContainer}
          activeOpacity={0.6}
        >
          <Bell size={24} color="#333" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoContainer: {
    // No extra styling
  },
  bellContainer: {
    // No extra styling
  },
});

export default HomeHeader;
