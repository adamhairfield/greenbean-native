#!/bin/bash

# Script to generate placeholder screens for Greenbean app

# Shop screens
cat > ../src/screens/shop/HomeScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default HomeScreen;
EOF

cat > ../src/screens/shop/CategoryScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CategoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Category Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default CategoryScreen;
EOF

cat > ../src/screens/shop/ProductDetailScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Product Detail Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default ProductDetailScreen;
EOF

cat > ../src/screens/shop/CartScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CartScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cart Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default CartScreen;
EOF

cat > ../src/screens/shop/CheckoutScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CheckoutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Checkout Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default CheckoutScreen;
EOF

cat > ../src/screens/shop/OrderConfirmationScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderConfirmationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Confirmation - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default OrderConfirmationScreen;
EOF

# Orders screens
cat > ../src/screens/orders/OrdersListScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrdersListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Orders List - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default OrdersListScreen;
EOF

cat > ../src/screens/orders/OrderDetailScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Detail - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default OrderDetailScreen;
EOF

# Account screens
cat > ../src/screens/account/ProfileScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default ProfileScreen;
EOF

cat > ../src/screens/account/EditProfileScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Profile - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default EditProfileScreen;
EOF

cat > ../src/screens/account/AddressesScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddressesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Addresses - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default AddressesScreen;
EOF

cat > ../src/screens/account/AddAddressScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddAddressScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Address - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default AddAddressScreen;
EOF

cat > ../src/screens/account/EditAddressScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditAddressScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Address - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default EditAddressScreen;
EOF

cat > ../src/screens/account/FavoritesScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FavoritesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default FavoritesScreen;
EOF

cat > ../src/screens/account/SettingsScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default SettingsScreen;
EOF

# Driver screens
cat > ../src/screens/driver/DeliveryListScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliveryListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Delivery List - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DeliveryListScreen;
EOF

cat > ../src/screens/driver/DeliveryDetailScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliveryDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Delivery Detail - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DeliveryDetailScreen;
EOF

cat > ../src/screens/driver/DeliveryMapScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliveryMapScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Delivery Map - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DeliveryMapScreen;
EOF

# Admin screens
cat > ../src/screens/admin/DashboardScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Dashboard - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DashboardScreen;
EOF

cat > ../src/screens/admin/ProductManagementScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Product Management - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default ProductManagementScreen;
EOF

cat > ../src/screens/admin/AddProductScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddProductScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Product - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default AddProductScreen;
EOF

cat > ../src/screens/admin/EditProductScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditProductScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Product - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default EditProductScreen;
EOF

cat > ../src/screens/admin/OrderManagementScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Management - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default OrderManagementScreen;
EOF

cat > ../src/screens/admin/DriverManagementScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DriverManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Driver Management - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DriverManagementScreen;
EOF

cat > ../src/screens/admin/DeliverySchedulesScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliverySchedulesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Delivery Schedules - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default DeliverySchedulesScreen;
EOF

cat > ../src/screens/admin/AnalyticsScreen.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnalyticsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Analytics - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#666' },
});

export default AnalyticsScreen;
EOF

echo "All placeholder screens generated successfully!"
