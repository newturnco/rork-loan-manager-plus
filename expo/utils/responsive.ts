import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;
  const isPhone = width < 768;
  
  const isLandscape = width > height;
  
  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  
  const contentMaxWidth = isTablet ? 1200 : width;
  const cardWidth = isLargeTablet 
    ? (contentMaxWidth - 64) / 3 
    : isTablet 
    ? (contentMaxWidth - 48) / 2 
    : width - 32;
  
  const horizontalPadding = isTablet ? 32 : 16;
  const cardGap = isTablet ? 16 : 12;
  
  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isPhone,
    isLandscape,
    numColumns,
    contentMaxWidth,
    cardWidth,
    horizontalPadding,
    cardGap,
  };
}
