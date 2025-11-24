# Greenbean Development Guide

This guide will help you continue building the Greenbean app.

## Current Status

### ✅ Completed
- Project setup and configuration
- Database schema with RLS policies
- Authentication system (sign up, sign in, sign out)
- Navigation structure (26 screens)
- Reusable UI components
- Shopping cart context
- HomeScreen with categories and products

### 🚧 In Progress
- Customer shopping interface

### 📋 To Do
- Product detail screen
- Cart screen
- Checkout flow
- Order management
- Driver interface
- Admin dashboard

## Development Workflow

### 1. Implementing a New Screen

Let's use `ProductDetailScreen` as an example:

#### Step 1: Plan the UI
```
ProductDetailScreen should show:
- Product image
- Product name and description
- Price and unit
- Farm information
- Organic badge
- Stock availability
- Quantity selector
- Add to cart button
```

#### Step 2: Create the Component Structure

```typescript
// src/screens/shop/ProductDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ShopStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';
import { Button, LoadingSpinner } from '../../components';

type ProductDetailScreenProps = {
  navigation: NativeStackNavigationProp<ShopStackParamList, 'ProductDetail'>;
  route: RouteProp<ShopStackParamList, 'ProductDetail'>;
};

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { productId } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Fetch product data
  // Implement quantity controls
  // Implement add to cart
  
  return (
    <ScrollView style={styles.container}>
      {/* Product UI */}
    </ScrollView>
  );
};
```

#### Step 3: Implement Data Fetching

```typescript
useEffect(() => {
  fetchProduct();
}, [productId]);

const fetchProduct = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name)
      `)
      .eq('id', productId)
      .single();

    if (error) throw error;
    setProduct(data);
  } catch (error) {
    console.error('Error fetching product:', error);
  } finally {
    setLoading(false);
  }
};
```

#### Step 4: Implement Actions

```typescript
const handleAddToCart = async () => {
  try {
    await addItem(productId, quantity);
    Alert.alert('Success', 'Added to cart!');
  } catch (error) {
    Alert.alert('Error', 'Failed to add to cart');
  }
};
```

#### Step 5: Style the Component

Use the theme constants:
```typescript
import { Colors, Spacing, BorderRadius } from '../../constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  // ... more styles
});
```

### 2. Working with Supabase

#### Common Query Patterns

**Fetch all items:**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_available', true);
```

**Fetch with relations:**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    customer:profiles!customer_id(full_name, email),
    items:order_items(
      *,
      product:products(name, price)
    )
  `)
  .eq('customer_id', userId);
```

**Insert data:**
```typescript
const { data, error } = await supabase
  .from('cart_items')
  .insert({
    user_id: userId,
    product_id: productId,
    quantity: 1,
  })
  .select();
```

**Update data:**
```typescript
const { error } = await supabase
  .from('orders')
  .update({ status: 'confirmed' })
  .eq('id', orderId);
```

**Delete data:**
```typescript
const { error } = await supabase
  .from('cart_items')
  .delete()
  .eq('id', itemId);
```

#### Real-time Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Order updated:', payload);
        // Update local state
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [userId]);
```

### 3. State Management Patterns

#### Using Context

```typescript
// In a component
const { user, profile, signOut } = useAuth();
const { items, addItem, removeItem, itemCount } = useCart();
```

#### Local State

```typescript
// For component-specific state
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [error, setError] = useState(null);
```

### 4. Navigation Patterns

#### Navigate to a screen:
```typescript
navigation.navigate('ProductDetail', { productId: '123' });
```

#### Go back:
```typescript
navigation.goBack();
```

#### Replace current screen:
```typescript
navigation.replace('OrderConfirmation', { orderId: '456' });
```

#### Navigate to a different stack:
```typescript
navigation.navigate('Account', {
  screen: 'Profile',
});
```

### 5. Form Handling

```typescript
const [formData, setFormData] = useState({
  street_address: '',
  city: '',
  state: '',
  zip_code: '',
});

const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  
  if (!formData.street_address) {
    newErrors.street_address = 'Address is required';
  }
  
  if (!formData.zip_code || !/^\d{5}$/.test(formData.zip_code)) {
    newErrors.zip_code = 'Valid ZIP code required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  // Submit form
};
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const { data, error } = await supabase
    .from('products')
    .select('*');
    
  if (error) throw error;
  
  setProducts(data);
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'Failed to load products');
} finally {
  setLoading(false);
}
```

### 2. Loading States

Show loading indicators:

```typescript
if (loading) {
  return <LoadingSpinner message="Loading..." />;
}

if (error) {
  return (
    <View style={styles.error}>
      <Text>Error: {error.message}</Text>
      <Button title="Retry" onPress={fetchData} />
    </View>
  );
}
```

### 3. Empty States

Handle empty data:

```typescript
{products.length === 0 ? (
  <View style={styles.empty}>
    <Text>No products available</Text>
  </View>
) : (
  <FlatList data={products} renderItem={renderProduct} />
)}
```

### 4. Type Safety

Use TypeScript types:

```typescript
import { Database } from '../../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
```

### 5. Component Organization

```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.styles.ts # Styles (optional)
├── ComponentName.types.ts  # Types (optional)
└── index.ts               # Export
```

## Testing

### Manual Testing Checklist

For each screen:
- [ ] Loads correctly
- [ ] Shows loading state
- [ ] Handles errors
- [ ] Shows empty state
- [ ] All buttons work
- [ ] Navigation works
- [ ] Data updates correctly
- [ ] Works on iOS and Android

### Test User Roles

Create test users for each role:
1. Customer: test@customer.com
2. Driver: test@driver.com
3. Admin: test@admin.com
4. Master: test@master.com

Change roles in Supabase dashboard.

## Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Solution**: Add null checks and optional chaining
```typescript
const name = product?.name ?? 'Unknown';
```

### Issue: "Network request failed"
**Solution**: Check Supabase URL and key in `.env`

### Issue: "RLS policy violation"
**Solution**: Check RLS policies in Supabase dashboard

### Issue: "State not updating"
**Solution**: Ensure you're using functional updates
```typescript
setItems(prev => [...prev, newItem]);
```

## Performance Tips

1. **Use FlatList for long lists**
   ```typescript
   <FlatList
     data={products}
     renderItem={renderProduct}
     keyExtractor={(item) => item.id}
     initialNumToRender={10}
     maxToRenderPerBatch={10}
   />
   ```

2. **Memoize expensive computations**
   ```typescript
   const total = useMemo(() => {
     return items.reduce((sum, item) => sum + item.price, 0);
   }, [items]);
   ```

3. **Debounce search inputs**
   ```typescript
   const debouncedSearch = useDebounce(searchTerm, 500);
   ```

4. **Optimize images**
   - Use appropriate image sizes
   - Implement lazy loading
   - Cache images

## Deployment Checklist

Before deploying:
- [ ] Update app version
- [ ] Test on physical devices
- [ ] Check all API keys are in environment variables
- [ ] Test all user flows
- [ ] Verify RLS policies
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics
- [ ] Create app icons and splash screens
- [ ] Write release notes

## Resources

- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **React Navigation**: https://reactnavigation.org
- **React Native**: https://reactnative.dev

## Getting Help

1. Check the error message carefully
2. Search in Expo/Supabase docs
3. Check GitHub issues
4. Ask in Discord communities:
   - Expo Discord
   - Supabase Discord
   - React Native Discord

## Next Features to Build

Priority order:
1. ✅ HomeScreen (Done)
2. ProductDetailScreen
3. CartScreen
4. CheckoutScreen
5. OrdersListScreen
6. OrderDetailScreen
7. ProfileScreen
8. AddressesScreen
9. Driver screens
10. Admin screens

Good luck building! 🚀
