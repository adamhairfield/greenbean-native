import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShopStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useFavorites } from '../../contexts/FavoritesContext';
import { Ionicons } from '@expo/vector-icons';
import { Heart } from 'lucide-react-native';
import { FilterModal, SortModal, FilterOptions, SortOption } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type SearchScreenProps = NativeStackScreenProps<ShopStackParamList, 'Search'>;

const SEARCH_HISTORY_KEY = '@greenbean_search_history';
const MAX_HISTORY_ITEMS = 10;

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const searchInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Filter & Sort state
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
    loadSearchHistory();
    fetchData();
    // Auto-focus search input
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchQuery, filters, sortBy, allProducts]);

  const loadSearchHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchToHistory = async (query: string) => {
    if (!query.trim()) return;

    try {
      const trimmed = query.trim();
      // Remove if already exists
      const filtered = searchHistory.filter(h => h !== trimmed);
      // Add to front
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      setSearchHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) setCategories(categoriesData);

      // Fetch all products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (productsData) {
        setAllProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let results = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.farm_name?.toLowerCase().includes(query)
      );
      setShowResults(true);
    } else {
      setShowResults(false);
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
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSubmitSearch = () => {
    if (searchQuery.trim()) {
      saveSearchToHistory(searchQuery);
    }
  };

  const handleHistoryItemPress = (query: string) => {
    setSearchQuery(query);
    saveSearchToHistory(query);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.organicOnly) count++;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.minPrice > 0 || filters.maxPrice < 100) count++;
    return count;
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
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
          size={20}
          color="#34A853"
          fill={isFavorite(item.id) ? '#34A853' : 'transparent'}
        />
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productFarm} numberOfLines={1}>
          {item.farm_name || 'Local Farm'}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            ${item.price.toFixed(2)}
            <Text style={styles.productUnit}>/{item.unit}</Text>
          </Text>
          {item.is_organic && (
            <View style={styles.organicBadge}>
              <Text style={styles.organicText}>🌿</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            placeholder="Search products, farms..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="filter" size={20} color="#34A853" />
          {activeFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
          <Ionicons name="swap-vertical" size={20} color="#34A853" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!showResults ? (
        <View style={styles.emptyState}>
          {/* Search History */}
          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <Text style={styles.historySectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={styles.clearHistoryText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {searchHistory.map((query, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(query)}
                >
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.historyItemText}>{query}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.categoriesSectionTitle}>Browse by Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryChip}
                  onPress={() => {
                    setFilters({ ...filters, categories: [category.id] });
                    setShowResults(true);
                  }}
                >
                  <Text style={styles.categoryChipText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </Text>
            {(searchQuery || activeFiltersCount() > 0) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setFilters({
                    minPrice: 0,
                    maxPrice: 100,
                    organicOnly: false,
                    categories: [],
                    maxDistance: 50,
                  });
                  setSortBy('newest');
                }}
              >
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#34A853" />
            </View>
          ) : filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.noResultsTitle}>No products found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowResults(true);
        }}
        currentFilters={filters}
        availableCategories={categories}
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        onSelect={setSortBy}
        currentSort={sortBy}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sortButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    padding: 16,
  },
  historySection: {
    marginBottom: 32,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  historyItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34A853',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 48,
  },
  productInfo: {
    padding: 12,
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
    fontWeight: '700',
    color: '#34A853',
  },
  productUnit: {
    fontSize: 12,
    fontWeight: '400',
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
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SearchScreen;
