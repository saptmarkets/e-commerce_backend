// Helper functions to determine aspect ratio type based on context

export const getAspectRatioType = (context, options = {}) => {
  const { folder, targetWidth, targetHeight, location, layoutType } = options;

  // Banner contexts
  if (folder === 'banners' || context === 'banner') {
    if (location) {
      switch (location) {
        case 'home-hero':
          return layoutType === 'triple' ? 'banner-home-hero' : 'banner-home-hero';
        case 'home-middle':
          return 'banner-home-middle';
        case 'products-hero':
          return 'banner-products-hero';
        case 'category-top':
          return 'banner-category-top';
        case 'promotions-hero':
          return 'banner-promotions-hero';
        case 'page-header':
          return 'banner-page-header';
        case 'sidebar-ads':
          return 'banner-sidebar-ads';
        case 'footer-banner':
          return 'banner-footer';
        default:
          return 'banner-home-hero';
      }
    }
    return 'banner-home-hero';
  }

  // Side banner contexts
  if (folder === 'banners/sides' || context === 'banner-side') {
    return 'banner-side';
  }

  // Category contexts
  if (folder === 'category' || context === 'category-icon') {
    return 'category-icon';
  }

  if (folder === 'category-headers' || context === 'category-header') {
    return 'category-header';
  }

  // Product contexts
  if (folder === 'products' || context === 'product') {
    return 'product-main';
  }

  // Profile contexts
  if (context === 'profile' || context === 'avatar') {
    return 'profile-avatar';
  }

  // Settings contexts
  if (context === 'favicon') {
    return 'favicon';
  }

  if (context === 'meta-image') {
    return 'meta-image';
  }

  if (context === 'logo') {
    return 'logo';
  }

  // Coupon contexts
  if (context === 'coupon') {
    return 'coupon-image';
  }

  // Store customization contexts
  if (context === 'store-hero') {
    return 'store-hero';
  }

  if (context === 'about-section') {
    return 'about-section';
  }

  if (context === 'feature-image') {
    return 'feature-image';
  }

  // Determine by dimensions if provided
  if (targetWidth && targetHeight) {
    const ratio = targetWidth / targetHeight;
    
    // Square images
    if (Math.abs(ratio - 1) < 0.1) {
      if (targetWidth <= 50) return 'favicon';
      if (targetWidth <= 250) return 'category-icon';
      if (targetWidth <= 300) return 'profile-avatar';
      return 'product-main';
    }
    
    // Wide banners
    if (ratio > 3) {
      if (targetHeight <= 200) return 'banner-footer';
      if (targetHeight <= 300) return 'banner-home-middle';
      return 'banner-home-hero';
    }
    
    // Portrait images
    if (ratio < 1) {
      return 'banner-sidebar-ads';
    }
    
    // Landscape images
    if (ratio > 1.5 && ratio < 3) {
      if (targetWidth >= 1500) return 'banner-home-hero';
      if (targetWidth >= 1000) return 'category-header';
      return 'feature-image';
    }
  }

  // Default fallback
  return 'default';
};

// Get human-readable context name
export const getContextDisplayName = (aspectRatioType) => {
  const contextNames = {
    'banner-home-hero': 'Home Page Hero Banner',
    'banner-home-middle': 'Home Page Middle Banner',
    'banner-products-hero': 'Products Page Hero Banner',
    'banner-category-top': 'Category Top Banner',
    'banner-promotions-hero': 'Promotions Page Hero Banner',
    'banner-page-header': 'Page Header Banner',
    'banner-sidebar-ads': 'Sidebar Advertisement',
    'banner-footer': 'Footer Banner',
    'banner-side': 'Side Banner',
    'category-icon': 'Category Icon',
    'category-header': 'Category Header Image',
    'product-main': 'Product Image',
    'profile-avatar': 'Profile Picture',
    'favicon': 'Website Favicon',
    'meta-image': 'Social Media Preview Image',
    'logo': 'Logo',
    'coupon-image': 'Coupon Image',
    'store-hero': 'Store Hero Banner',
    'about-section': 'About Section Image',
    'feature-image': 'Feature Image',
    'default': 'General Image'
  };

  return contextNames[aspectRatioType] || 'Image';
};

// Validate if image dimensions are suitable for context
export const validateImageForContext = (imageWidth, imageHeight, aspectRatioType) => {
  const { ASPECT_RATIOS } = require('@/components/image-uploader/ImageCropper');
  const config = ASPECT_RATIOS[aspectRatioType];
  
  if (!config) return { valid: true, message: '' };

  const imageRatio = imageWidth / imageHeight;
  const targetRatio = config.ratio;
  const tolerance = 0.1;

  // Check if image is too small
  const minDimension = Math.min(config.width, config.height);
  if (Math.min(imageWidth, imageHeight) < minDimension * 0.5) {
    return {
      valid: false,
      message: `Image is too small. Minimum recommended size is ${config.width}×${config.height}px`
    };
  }

  // Check if aspect ratio is very different (will require significant cropping)
  if (Math.abs(imageRatio - targetRatio) > tolerance) {
    return {
      valid: true,
      message: `Image will be cropped to fit ${config.label} aspect ratio`
    };
  }

  return { valid: true, message: '' };
}; 