import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌱</Text>
        <Text style={styles.title}>Greenbean</Text>
        <Text style={styles.subtitle}>
          Fresh from local farms, delivered to your door
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7FAC4E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#7FAC4E',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7FAC4E',
  },
  secondaryButtonText: {
    color: '#7FAC4E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
