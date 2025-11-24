import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddAddressScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AddAddress - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#666' },
});

export default AddAddressScreen;
