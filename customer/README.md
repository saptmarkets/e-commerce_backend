SAPT Markets Frontend Documentation

# SaptMarkets - Customer App

## Recent Updates

### Product Detail Page Fixes

#### Fixed Issues:
1. **Image Display**: Changed product images from rectangular (`h-80`) to square aspect ratio (`aspect-square`) for better visual consistency
2. **Image Loading**: Improved image error handling with proper fallback to placeholder when images fail to load
3. **Unit-specific Promotions**: Enhanced promotion pricing calculation to properly handle offers/promotions for specific product units
4. **Promotion Application**: Fixed issue where selecting different units wasn't applying their specific promotional prices

#### Technical Changes:
- Updated `ProductDetailCard.js` and `ProductDetailCardEnhanced.js` with square image containers
- Enhanced promotion fetching logic to check for unit-specific promotions when units are changed
- Improved error handling for image loading with visual fallbacks
- Updated `useEnhancedMultiUnits.js` hook to better handle unit-specific promotions
- Added better pricing calculation logic that considers different promotion types (fixed_price, bulk_purchase, percentage_discount)

#### Files Modified:
- `src/components/product/ProductDetailCard.js`
- `src/components/product/ProductDetailCardEnhanced.js`  
- `src/pages/product/[slug].js`
- `src/hooks/useEnhancedMultiUnits.js`

