import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AnalyticsStackParamList } from './types';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

const AnalyticsNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Stack.Navigator>
  );
};

export default AnalyticsNavigator;
