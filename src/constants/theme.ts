export const Colors = {
  primary: '#7FAC4E',
  primaryDark: '#658A3E',
  primaryLight: '#B8D49A',
  
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  secondaryLight: '#BBDEFB',
  
  accent: '#FF9800',
  
  success: '#7FAC4E',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#FFFFFF',
  },
  
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
    dark: '#333333',
  },
  
  border: {
    light: '#E0E0E0',
    main: '#CCCCCC',
    dark: '#999999',
  },
  
  organic: '#8BC34A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
