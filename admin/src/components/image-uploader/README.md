# Robust Image Upload System with Smart Cropping

This system provides Facebook-like image cropping functionality that automatically detects the context and applies the perfect aspect ratio for each use case.

## 🎯 Features

- **Smart Context Detection**: Automatically determines the correct aspect ratio based on usage context
- **Facebook-like Cropper**: Interactive cropping with zoom, rotation, and real-time preview
- **Perfect Fit Guarantee**: Ensures all images fit their intended canvas perfectly
- **26+ Predefined Contexts**: Covers all image upload scenarios in the application
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Cache-busting Upload**: Integrates with the backend API for proper cache invalidation

## 📋 All Image Upload Contexts

### Banner Contexts
- `banner-home-hero` - Home Page Hero Carousel (1920×400)
- `banner-home-middle` - Home Page Middle Banner (1200×300) 
- `banner-products-hero` - Products Page Hero (1920×300)
- `banner-category-top` - Category Section Top (1200×200)
- `banner-promotions-hero` - Promotions Page Hero (1920×350)
- `banner-page-header` - Page Headers (1920×250)
- `banner-sidebar-ads` - Sidebar Advertisements (300×400)
- `banner-footer` - Footer Banner (1200×150)
- `banner-side` - Side Banner (400×300)

### Category Contexts
- `category-icon` - Category Icon (Square 238×238)
- `category-header` - Category Header Image (1200×300)

### Product Contexts
- `product-main` - Product Image (Square 800×800)

### Profile & Settings Contexts
- `profile-avatar` - Profile Picture (Square 200×200)
- `favicon` - Website Favicon (Square 32×32)
- `meta-image` - Social Media Preview Image (1200×630)
- `logo` - Logo (16:9 320×180)

### Store Customization Contexts
- `store-hero` - Store Hero Banner (1920×400)
- `about-section` - About Section Image (16:9 800×450)
- `feature-image` - Feature Image (4:3 800×600)

### Coupon Contexts
- `coupon-image` - Coupon Image (16:9 400×225)

## 🚀 Quick Start

### 1. Basic Usage with Auto-Detection

```jsx
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";

// The system will auto-detect aspect ratio from folder and dimensions
<UploaderWithCropper
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  folder="banners"
  targetWidth={1920}
  targetHeight={400}
/>
```

### 2. Explicit Context Usage

```jsx
// For banner uploads
<UploaderWithCropper
  imageUrl={bannerUrl}
  setImageUrl={setBannerUrl}
  context="banner"
  location="home-hero"
  layoutType="single"
  folder="banners"
/>

// For category icons
<UploaderWithCropper
  imageUrl={iconUrl}
  setImageUrl={setIconUrl}
  context="category-icon"
  folder="category"
/>

// For product images
<UploaderWithCropper
  imageUrl={productImages}
  setImageUrl={setProductImages}
  context="product"
  product={true}
  folder="products"
/>
```

## 🔧 Implementation Examples

### Banner Upload (BannerDrawer.jsx)

```jsx
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";

// Replace existing Uploader with:
<UploaderWithCropper
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  context="banner"
  location={selectedLocation} // 'home-hero', 'home-middle', etc.
  layoutType={layoutType}     // 'single' or 'triple'
  folder="banners"
  title="Upload Banner Image"
/>

// For side images:
<UploaderWithCropper
  imageUrl={leftImageUrl1}
  setImageUrl={setLeftImageUrl1}
  context="banner-side"
  folder="banners/sides"
  title="Upload Left Side Image"
/>
```

### Category Upload (CategoryDrawer.jsx)

```jsx
// Category Icon
<UploaderWithCropper
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  context="category-icon"
  folder="category"
  title="Upload Category Icon"
/>

// Category Header
<UploaderWithCropper
  imageUrl={headerImageUrl}
  setImageUrl={setHeaderImageUrl}
  context="category-header"
  folder="category-headers"
  title="Upload Category Header"
/>
```

## 🎛️ Props Reference

### UploaderWithCropper Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | string/array | - | Current image URL(s) |
| `setImageUrl` | function | - | Function to update image URL(s) |
| `context` | string | - | Explicit context type (see contexts above) |
| `folder` | string | - | Upload folder for organization |
| `location` | string | - | Banner location (for banner context) |
| `layoutType` | string | - | Banner layout type (single/triple) |
| `targetWidth` | number | 800 | Target width (for auto-detection) |
| `targetHeight` | number | 800 | Target height (for auto-detection) |
| `product` | boolean | false | Enable multiple image upload |
| `enableCropper` | boolean | true | Enable/disable cropper functionality |
| `title` | string | "Upload Image" | Cropper modal title |

## 🔄 Migration Guide

### From Original Uploader

1. **Import the new component:**
```jsx
// Old
import Uploader from "@/components/image-uploader/Uploader";

// New
import UploaderWithCropper from "@/components/image-uploader/UploaderWithCropper";
```

2. **Update the component usage:**
```jsx
// Old
<Uploader
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  folder="banners"
  targetWidth={1920}
  targetHeight={400}
/>

// New
<UploaderWithCropper
  imageUrl={imageUrl}
  setImageUrl={setImageUrl}
  context="banner"
  location="home-hero"
  folder="banners"
/>
```

## 🎨 Enhanced Cropper Features

### Advanced Zoom Control
- **Extended Range**: 0.1x to 5x zoom (can zoom out below 100% for large images)
- **Quick Presets**: 50%, 100%, 200% buttons for instant zoom levels
- **Precise Control**: Slider + dedicated zoom in/out buttons
- **Zoom Out Capability**: Perfect for fitting large images into smaller crop areas

### Smart Rotation
- **Full Range**: 0° to 360° with precise slider control
- **Quick Rotation**: 90° left/right buttons for instant orientation changes
- **Visual Feedback**: Real-time rotation preview

### Professional Controls
- **Grid Overlay**: Visual guide for perfect alignment
- **Real-time Preview**: See exact result while cropping
- **Touch Support**: Works seamlessly on mobile devices
- **Reset Functionality**: One-click reset for crop, zoom, and rotation

## 🎉 Result

With this system, every image upload in your application will:
- ✅ Have the perfect aspect ratio for its context
- ✅ Provide a professional cropping experience with enhanced zoom (0.1x-5x)
- ✅ Automatically optimize for the intended use case
- ✅ Support zoom out for large images that need to fit in smaller crop areas
- ✅ Offer quick controls for common operations (50%, 100%, 200% zoom, 90° rotation)
- ✅ Maintain consistent design across the entire application
- ✅ Cache-bust properly to avoid stale images

The system covers **all 26+ image upload contexts** in your application, from tiny favicons to large hero banners, ensuring every image fits perfectly where it's intended to be displayed!
