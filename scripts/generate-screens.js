const fs = require('fs');
const path = require('path');

const screenTemplate = (screenName) => `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ${screenName} = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${screenName.replace('Screen', '')} - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#666' },
});

export default ${screenName};
`;

const screens = {
  'shop': ['HomeScreen', 'CategoryScreen', 'ProductDetailScreen', 'CartScreen', 'CheckoutScreen', 'OrderConfirmationScreen'],
  'orders': ['OrdersListScreen', 'OrderDetailScreen'],
  'account': ['ProfileScreen', 'EditProfileScreen', 'AddressesScreen', 'AddAddressScreen', 'EditAddressScreen', 'FavoritesScreen', 'SettingsScreen'],
  'driver': ['DeliveryListScreen', 'DeliveryDetailScreen', 'DeliveryMapScreen'],
  'admin': ['DashboardScreen', 'ProductManagementScreen', 'AddProductScreen', 'EditProductScreen', 'OrderManagementScreen', 'DriverManagementScreen', 'DeliverySchedulesScreen', 'AnalyticsScreen']
};

const srcPath = path.join(__dirname, '..', 'src', 'screens');

Object.entries(screens).forEach(([folder, screenList]) => {
  const folderPath = path.join(srcPath, folder);
  
  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  // Create each screen file
  screenList.forEach(screenName => {
    const filePath = path.join(folderPath, `${screenName}.tsx`);
    fs.writeFileSync(filePath, screenTemplate(screenName));
    console.log(`Created: ${folder}/${screenName}.tsx`);
  });
});

console.log('\n✅ All placeholder screens generated successfully!');
