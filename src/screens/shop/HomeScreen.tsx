import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShopStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useCart } from '../../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { Card, LoadingSpinner } from '../../components';

type Category = Database['public']['Tables']['categories']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<ShopStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) setCategories(categoriesData);

      // Fetch featured products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .limit(6);

      if (productsData) setFeaturedProducts(productsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome to</Text>
          <Text style={styles.title}>Greenbean Market 🌱</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner */}
        <Card style={styles.banner}>
          <Text style={styles.bannerTitle}>Fresh from Local Farms</Text>
          <Text style={styles.bannerText}>
            Delivered twice a week to your door
          </Text>
        </Card>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate('Category', {
                      categoryId: item.id,
                      categoryName: item.name,
                    })
                  }
                >
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryEmoji}>
                      {getCategoryEmoji(item.name)}
                    </Text>
                  </View>
                  <Text style={styles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>
              No categories available. Please add categories in the admin panel.
            </Text>
          )}
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {featuredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {featuredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      productId: product.id,
                    })
                  }
                >
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImage}>
                      <Text style={styles.productEmoji}>🥬</Text>
                    </View>
                  )}
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productFarm} numberOfLines={1}>
                    {product.farm_name || 'Local Farm'}
                  </Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>
                      ${product.price.toFixed(2)}
                      <Text style={styles.productUnit}>/{product.unit}</Text>
                    </Text>
                    {product.is_organic && (
                      <View style={styles.organicBadge}>
                        <Text style={styles.organicText}>🌿</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No products available yet. Check back soon!
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getCategoryEmoji = (name: string): string => {
  const emojiMap: { [key: string]: string } = {
    Vegetables: '🥬',
    Fruits: '🍎',
    Dairy: '🥛',
    'Meat & Poultry': '🍗',
    Eggs: '🥚',
    'Baked Goods': '🥖',
    Preserves: '🫙',
    'Honey & Syrup': '🍯',
  };
  return emojiMap[name] || '🌱';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  banner: {
    margin: 16,
    padding: 24,
    backgroundColor: '#4CAF50',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  categoryCard: {
    alignItems: 'center',
    marginLeft: 16,
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: '1.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productEmoji: {
    fontSize: 48,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productFarm: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organicText: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
});

export default HomeScreen;
