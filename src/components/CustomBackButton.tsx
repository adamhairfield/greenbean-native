import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const CustomBackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.button}
    >
      <ArrowLeft size={24} color="#000" strokeWidth={2} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
});

export default CustomBackButton;
