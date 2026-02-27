// Default category images mapping
// These are emoji-based placeholders that can be replaced with actual image URLs
export const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  dairy: '🥛',
  meat: '🥩',
  eggs: '🥚',
  bakery: '🍞',
  herbs: '🌿',
  honey: '🍯',
  preserves: '🍯',
  flowers: '🌸',
  default: '🥕',
};

export const getDefaultImageForCategory = (categoryName?: string | null): string => {
  if (!categoryName) return DEFAULT_CATEGORY_IMAGES.default;
  
  const normalized = categoryName.toLowerCase();
  return DEFAULT_CATEGORY_IMAGES[normalized] || DEFAULT_CATEGORY_IMAGES.default;
};

// Helper to check if an image URL is valid
export const isValidImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
};
