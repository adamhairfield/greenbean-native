import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ width = 189, height = 32, light = false }) => {
  const imageStyle: ImageStyle = {
    width,
    height,
    resizeMode: 'contain',
  };

  return (
    <Image
      source={light ? require('../../assets/logo-light.png') : require('../../assets/logo.png')}
      style={imageStyle}
    />
  );
};

export default Logo;
