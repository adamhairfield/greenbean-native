import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  // Temporarily always show onboarding for testing
  // const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList>('Onboarding');
  // const [isReady, setIsReady] = useState(false);

  // useEffect(() => {
  //   const checkOnboarding = async () => {
  //     try {
  //       const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
  //       if (hasSeenOnboarding === 'true') {
  //         setInitialRoute('SignIn');
  //       }
  //     } catch (error) {
  //       console.error('Error checking onboarding status:', error);
  //     } finally {
  //       setIsReady(true);
  //     }
  //   };

  //   checkOnboarding();
  // }, []);

  // if (!isReady) {
  //   return null;
  // }

  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
