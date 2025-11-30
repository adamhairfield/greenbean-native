import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import {
  registerForPushNotificationsAsync,
  unregisterPushToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../services/pushNotificationService';

interface NotificationContextType {
  // Add any methods you want to expose
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Register for push notifications when user logs in
      registerForPushNotificationsAsync(user.id);

      // Listen for notifications received while app is in foreground
      notificationListener.current = addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      // Listen for user tapping on notification
      responseListener.current = addNotificationResponseListener((response) => {
        console.log('Notification tapped:', response);
        
        const data = response.notification.request.content.data;
        
        // Log the notification data - navigation will be handled by deep linking
        if (data?.type === 'refund' || data?.type === 'order') {
          console.log('Order notification tapped, orderId:', data?.orderId);
          // TODO: Implement deep linking to navigate to order detail
        }
      });

      return () => {
        // Cleanup listeners
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    } else {
      // User logged out - unregister push token
      if (user === null && lastUserId) {
        unregisterPushToken(lastUserId);
        setLastUserId(null);
      }
    }
  }, [user, lastUserId]);

  // Store user ID for cleanup on logout
  useEffect(() => {
    if (user) {
      setLastUserId(user.id);
    }
  }, [user]);

  const value = {};

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
