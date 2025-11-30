import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from './types';
import { CustomBackButton } from '../components';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

const AnalyticsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: (props) => props.canGoBack ? <CustomBackButton /> : undefined,
      }}
    >
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Stack.Navigator>
  );
};

export default AnalyticsNavigator;
