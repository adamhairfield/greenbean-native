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
import { useFavorites } from '../../contexts/FavoritesContext';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import { Heart } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, LoadingSpinner, SearchBar, FilterModal, SortModal, FilterOptions, SortOption } from '../../components';

type Category = Database['public']['Tables']['categories']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type PromoCode = {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<ShopStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { recentlyViewed } = useRecentlyViewed();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 100,
    organicOnly: false,
    categories: [],
    maxDistance: 50,
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch recently viewed products
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      fetchRecentlyViewedProducts();
    } else {
      setRecentlyViewedProducts([]);
    }
  }, [recentlyViewed]);

  const fetchRecentlyViewedProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', recentlyViewed.slice(0, 10))
        .eq('is_available', true);

      if (data) {
        // Sort by recently viewed order
        const sorted = recentlyViewed
          .map(id => data.find(p => p.id === id))
          .filter(p => p !== undefined) as Product[];
        setRecentlyViewedProducts(sorted);
      }
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) setCategories(categoriesData);

      // Fetch active promo code that should show on banner
      const { data: promoData } = await supabase
        .from('promo_codes')
        .select('id, code, description, discount_type, discount_value')
        .eq('is_active', true)
        .eq('show_on_banner', true)
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (promoData) {
        setActivePromo(promoData);
      }

      // Fetch featured products - show all available products for now
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      }
      
      console.log('Featured products:', productsData?.map(p => ({ name: p.name, seller_id: p.seller_id })));
      
      if (productsData) {
        setFeaturedProducts(productsData);
        setFilteredProducts(productsData);
      }
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

  // Apply search, filter, and sort
  useEffect(() => {
    let results = [...featuredProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.farm_name?.toLowerCase().includes(query)
      );
    }

    // Price filter
    results = results.filter(p => 
      p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    // Organic filter
    if (filters.organicOnly) {
      results = results.filter(p => p.is_organic);
    }

    // Category filter
    if (filters.categories.length > 0) {
      results = results.filter(p => 
        p.category_id && filters.categories.includes(p.category_id)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'name_az':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_za':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'popularity':
        results.sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));
        break;
      case 'newest':
      default:
        results.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        break;
    }

    setFilteredProducts(results);
  }, [searchQuery, filters, sortBy, featuredProducts]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.organicOnly) count++;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.minPrice > 0 || filters.maxPrice < 100) count++;
    return count;
  };

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar - Tap to navigate to SearchScreen */}
      <TouchableOpacity
        style={styles.searchBarContainer}
        activeOpacity={1}
        onPress={() => navigation.navigate('Search')}
      >
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchBarIcon} />
          <Text style={styles.searchBarPlaceholder}>Search products, farms...</Text>
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner */}
        {activePromo ? (
          <Card style={styles.promoBanner}>
            <View style={styles.promoHeader}>
              <Text style={styles.promoCode}>{activePromo.code}</Text>
              <Text style={styles.promoDiscount}>
                {activePromo.discount_type === 'percentage' 
                  ? `${activePromo.discount_value}% OFF` 
                  : `$${activePromo.discount_value} OFF`}
              </Text>
            </View>
            <Text style={styles.promoDescription}>
              {activePromo.description || 'Use this code at checkout'}
            </Text>
          </Card>
        ) : (
          <Card style={styles.banner}>
            <Text style={styles.bannerTitle}>Fresh from Local Farms</Text>
            <Text style={styles.bannerText}>
              Delivered twice a week to your door
            </Text>
          </Card>
        )}

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
          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
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
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    <Heart
                      size={20}
                      color="#34A853"
                      fill={isFavorite(product.id) ? '#34A853' : 'transparent'}
                    />
                  </TouchableOpacity>
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

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentlyViewedProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.recentlyViewedCard}
                  onPress={() =>
                    navigation.navigate('ProductDetail', {
                      productId: product.id,
                    })
                  }
                >
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.recentlyViewedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.recentlyViewedImage}>
                      <Text style={styles.productEmoji}>🥬</Text>
                    </View>
                  )}
                  <Text style={styles.recentlyViewedName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.recentlyViewedPrice}>
                    ${product.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        availableCategories={categories}
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        onSelect={handleSortChange}
        currentSort={sortBy}
      />
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
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchBarPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  banner: {
    margin: 16,
    padding: 24,
    backgroundColor: '#34A853',
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
  promoBanner: {
    margin: 16,
    padding: 20,
    backgroundColor: '#34A853',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  promoDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
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
    color: '#34A853',
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
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1,
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
    color: '#34A853',
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
    marginTop: 16,
  },
  recentlyViewedCard: {
    width: 140,
    marginRight: 12,
  },
  recentlyViewedImage: {
    width: 140,
    height: 140,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentlyViewedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recentlyViewedPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34A853',
  },
});

export default HomeScreen;
