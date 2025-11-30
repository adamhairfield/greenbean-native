import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface NotificationButtonProps {
  onPress: () => void;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ onPress }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to changes
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.notificationButton}
      activeOpacity={0.6}
    >
      <Bell size={24} color="#333" strokeWidth={2} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    marginRight: 16,
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationButton;
