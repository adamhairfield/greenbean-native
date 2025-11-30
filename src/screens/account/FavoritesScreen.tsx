import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AccountStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Heart } from 'lucide-react-native';
import { LoadingSpinner } from '../../components';

type Product = Database['public']['Tables']['products']['Row'];

type FavoritesScreenProps = {
  navigation: NativeStackNavigationProp<AccountStackParamList, 'Favorites'>;
};

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { favorites, toggleFavorite, refreshFavorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavoriteProducts();
  }, [favorites]);

  const fetchFavoriteProducts = async () => {
    if (!user || favorites.size === 0) {
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const favoriteIds = Array.from(favorites);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favoriteIds)
        .eq('is_available', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching favorite products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFavorites();
  };

  const handleProductPress = (productId: string) => {
    // Navigate to product detail - we need to navigate to the Shop stack
    navigation.navigate('Profile');
    // Note: To navigate to ProductDetail, we'd need access to the Shop navigator
    // For now, we'll just go back to profile
  };

  if (loading) {
    return <LoadingSpinner message="Loading favorites..." />;
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item.id)}
    >
      <View>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImage}>
            <Text style={styles.productEmoji}>🥬</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
        >
          <Heart
            size={18}
            color="#4CAF50"
            fill="#4CAF50"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productFarm} numberOfLines={1}>
          {item.farm_name || 'Local Farm'}
        </Text>
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            ${item.price.toFixed(2)}
            <Text style={styles.productUnit}>/{item.unit}</Text>
          </Text>
          {item.is_organic && (
            <View style={styles.organicBadge}>
              <Text style={styles.organicText}>🌿 Organic</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {products.length} {products.length === 1 ? 'favorite' : 'favorites'}
            </Text>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💚</Text>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Start adding products to your favorites by tapping the heart icon on any product.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  productEmoji: {
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productFarm: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
  organicBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  organicText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FavoritesScreen;
