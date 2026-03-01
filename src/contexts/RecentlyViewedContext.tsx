import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_VIEWED_KEY = '@greenbean_recently_viewed';
const MAX_RECENTLY_VIEWED = 20;

interface RecentlyViewedContextType {
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => Promise<void>;
  clearRecentlyViewed: () => Promise<void>;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const addRecentlyViewed = async (productId: string) => {
    try {
      // Remove if already exists (to move to front)
      const filtered = recentlyViewed.filter(id => id !== productId);
      // Add to front
      const updated = [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      setRecentlyViewed(updated);
      await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding recently viewed:', error);
    }
  };

  const clearRecentlyViewed = async () => {
    try {
      setRecentlyViewed([]);
      await AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  };

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, addRecentlyViewed, clearRecentlyViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return context;
};
