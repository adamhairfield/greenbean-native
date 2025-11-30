import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and save token to database
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7FAC4E',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the Expo push token
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'greenbean-app',
    })).data;
    
    console.log('Push token:', token);
    
    // Save token to database
    if (token) {
      await savePushToken(userId, token);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Save push token to database
 */
async function savePushToken(userId: string, token: string) {
  try {
    const deviceName = `${Device.brand} ${Device.modelName}`;
    
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token,
        device_name: deviceName,
      }, {
        onConflict: 'user_id,token',
      });

    if (error) {
      console.error('Error saving push token:', error);
    } else {
      console.log('Push token saved successfully');
    }
  } catch (error) {
    console.error('Error in savePushToken:', error);
  }
}

/**
 * Remove push token from database (e.g., on logout)
 */
export async function unregisterPushToken(userId: string) {
  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'greenbean-app',
    })).data;

    if (token) {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('Error removing push token:', error);
      }
    }
  } catch (error) {
    console.error('Error in unregisterPushToken:', error);
  }
}

/**
 * Add notification listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Show immediately
  });
}
