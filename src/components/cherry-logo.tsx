import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const logo = require('../../assets/cherry-logo.jpg');

interface CherryLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function CherryLogo({ size = 40, style }: CherryLogoProps) {
  return (
    <Image
      source={logo}
      style={[{ width: size, height: size, borderRadius: size * 0.42 }, style]}
      resizeMode="contain"
    />
  );
}
