# Multi-Unit System Implementation

## Overview

The multi-unit system allows products to be sold in different unit configurations (e.g., individual pieces, dozens, cases, kilograms) with different pricing and pack quantities. This system provides flexibility for both B2B and B2C scenarios where customers need to purchase products in various quantities.

## Architecture

### Backend Models

#### 1. Product Model
- `basicUnit`: Reference to the base unit type (ObjectId → Unit)
- `hasMultiUnits`: Boolean flag indicating if product supports multiple units
- `availableUnits`: Array of available unit references
- `price`: Price for one basic unit (base price)

#### 2. ProductUnit Model
- `product`: Reference to the main product (ObjectId → Product)
- `unit`: Reference to the unit type (ObjectId → Unit)
- `unitValue`: Multiplier for the unit (e.g., 2 for "2 Dozens")
- `packQty`: Number of basic units in this package (e.g., 12 for "Dozen")
- `price`: Price for this specific unit configuration
- `isDefault`: Whether this is the default unit for display
- `isActive`: Whether this unit is available for purchase

#### 3. Unit Model
- `name`: Full name of the unit (e.g., "Dozen", "Case")
- `shortCode`: Short code (e.g., "dz", "cs", "pcs")
- `type`: Unit type classification (base, pack, weight, volume)
- `isBase`: Whether this is a base unit

### Frontend Components

#### 1. ProductCardEnhanced
- Enhanced version of the product card with multi-unit support
- Unit selection dropdown
- Dynamic pricing display
- Stock calculation based on pack quantities
- Fallback support for non-multi-unit products

#### 2. ProductCardMultiUnit
- Dedicated multi-unit product card component
- Comprehensive unit information display
- Advanced unit comparison features

#### 3. useMultiUnits Hook
- Custom React hook for managing multi-unit functionality
- Handles unit fetching, selection, pricing calculations
- Provides reusable multi-unit logic across components

## Features

### 1. Unit Selection
- Dropdown interface for selecting different units
- Clear display of pack quantities and pricing
- Visual indicators for multi-unit products

### 2. Dynamic Pricing
- Real-time price updates based on selected unit
- Display of price per base unit
- Comparison with original product price

### 3. Smart Stock Management
- Stock calculations based on pack quantities
- Available unit quantity display
- Prevents overselling based on actual stock

### 4. Cart Integration
- Unique cart items for each unit selection
- Proper unit information preservation
- Accurate pricing and quantity management

### 5. Performance Optimization
- Efficient API calls with proper caching
- Fallback mechanisms for better UX
- Optimized database queries

## API Endpoints

### Product Unit Routes (`/api/product-units`)

```javascript
// Get all units for a specific product
GET /product-units/product/:productId

// Get specific product unit by ID
GET /product-units/:unitId

// Create new unit for a product
POST /product-units/product/:productId

// Update product unit
PUT /product-units/product/:productId/unit/:unitId

// Delete product unit
DELETE /product-units/product/:productId/unit/:unitId

// Calculate stock requirement
POST /product-units/stock-requirement

// Get best value unit
GET /product-units/product/:productId/best-value

// Compare unit pricing
GET /product-units/product/:productId/compare
```

## Usage Examples

### 1. Basic Implementation

```jsx
import ProductCardEnhanced from "@components/product/ProductCardEnhanced";

const ProductGrid = ({ products, attributes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCardEnhanced
          key={product._id}
          product={product}
          attributes={attributes}
        />
      ))}
    </div>
  );
};
```

### 2. Using the Multi-Unit Hook

```jsx
import useMultiUnits from "@hooks/useMultiUnits";

const CustomProductCard = ({ product }) => {
  const {
    selectedUnit,
    availableUnits,
    availableStock,
    currentUnitDisplayName,
    hasMultipleUnits,
    handleUnitSelection,
    getPricingBreakdown
  } = useMultiUnits(product);

  // Custom implementation using hook data
  return (
    <div>
      {hasMultipleUnits && (
        <select onChange={(e) => handleUnitSelection(availableUnits.find(u => u._id === e.target.value))}>
          {availableUnits.map(unit => (
            <option key={unit._id} value={unit._id}>
              {unit.unit?.name} - ${unit.price}
            </option>
          ))}
        </select>
      )}
      {/* Rest of component */}
    </div>
  );
};
```

### 3. Cart Integration

```jsx
const handleAddToCart = () => {
  const cartItem = {
    id: `${product._id}-${selectedUnit._id}`,
    productId: product._id,
    selectedUnitId: selectedUnit._id,
    title: product.title,
    price: selectedUnit.price,
    unitName: selectedUnit.unit?.name,
    packQty: selectedUnit.packQty,
    isMultiUnit: true
  };
  
  addItem(cartItem, quantity);
};
```

## Database Setup

### 1. Create Units

```javascript
// Create base units
const units = [
  { name: "Piece", shortCode: "pcs", type: "base", isBase: true },
  { name: "Dozen", shortCode: "dz", type: "pack", isBase: false },
  { name: "Case", shortCode: "cs", type: "pack", isBase: false },
  { name: "Kilogram", shortCode: "kg", type: "weight", isBase: true }
];

await Unit.insertMany(units);
```

### 2. Create Product with Multi-Units

```javascript
// Create product
const product = new Product({
  title: { en: "Sample Product" },
  price: 10, // Price for one basic unit
  basicUnit: pcsUnitId,
  hasMultiUnits: true,
  availableUnits: [pcsUnitId, dozenUnitId, caseUnitId]
});

// Create product units
const productUnits = [
  {
    product: product._id,
    unit: pcsUnitId,
    unitValue: 1,
    packQty: 1,
    price: 10,
    isDefault: true
  },
  {
    product: product._id,
    unit: dozenUnitId,
    unitValue: 1,
    packQty: 12,
    price: 110 // 10% discount for bulk
  },
  {
    product: product._id,
    unit: caseUnitId,
    unitValue: 1,
    packQty: 144, // 12 dozens
    price: 1200 // Better bulk pricing
  }
];

await ProductUnit.insertMany(productUnits);
```

## Configuration

### 1. Environment Variables

```env
# API URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:5055
```

### 2. Next.js Configuration

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`
      }
    ];
  }
};
```

## Testing

### Demo Page
Visit `/multi-unit-demo` to see the system in action with:
- Products with multi-unit support
- Regular products (fallback behavior)
- Feature explanations and usage instructions
- Toggle between different card implementations

### API Testing

```bash
# Test product units endpoint
curl http://localhost:5055/api/product-units/product/{productId}

# Test unit creation
curl -X POST http://localhost:5055/api/product-units/product/{productId} \
  -H "Content-Type: application/json" \
  -d '{
    "unit": "unitId",
    "unitValue": 1,
    "packQty": 12,
    "price": 110
  }'
```

## Migration Guide

### Updating Existing Products

1. **Add Required Fields**:
   ```javascript
   await Product.updateMany(
     { basicUnit: { $exists: false } },
     { 
       $set: { 
         basicUnit: defaultPcsUnitId,
         hasMultiUnits: false,
         availableUnits: [defaultPcsUnitId]
       }
     }
   );
   ```

2. **Create Default Product Units**:
   ```javascript
   const products = await Product.find({ hasMultiUnits: false });
   
   for (const product of products) {
     await ProductUnit.create({
       product: product._id,
       unit: product.basicUnit,
       unitValue: 1,
       packQty: 1,
       price: product.price,
       isDefault: true,
       isActive: true
     });
   }
   ```

### Updating Frontend Components

1. Replace `ProductCardSimple` imports with `ProductCardEnhanced`
2. Update product fetching to include unit information
3. Test cart functionality with multi-unit products

## Best Practices

### 1. Unit Configuration
- Always set a default unit for each product
- Ensure pack quantities are logical (e.g., dozen = 12 pieces)
- Price units competitively to encourage bulk purchases

### 2. Stock Management
- Calculate stock based on base units
- Display available quantities for each unit type
- Implement proper stock validation

### 3. User Experience
- Provide clear unit descriptions and pack quantities
- Show price per base unit for comparison
- Include fallback behavior for loading states

### 4. Performance
- Use efficient database queries with proper indexing
- Implement caching for frequently accessed units
- Optimize API responses with necessary fields only

## Troubleshooting

### Common Issues

1. **Units not loading**: Check if `hasMultiUnits` is set correctly and units exist
2. **Incorrect pricing**: Verify `packQty` calculations and unit price setup
3. **Stock issues**: Ensure stock calculations account for pack quantities
4. **Cart problems**: Check unique cart item IDs include unit information

### Debugging

```javascript
// Enable debug logging
console.log('Product units:', availableUnits);
console.log('Selected unit:', selectedUnit);
console.log('Available stock:', availableStock);
console.log('Pricing breakdown:', getPricingBreakdown(quantity));
```

## Future Enhancements

1. **Bulk Pricing**: Implement quantity-based pricing tiers
2. **Unit Conversions**: Add automatic unit conversion capabilities
3. **Advanced Analytics**: Track unit preference and sales data
4. **Mobile Optimization**: Enhance mobile UX for unit selection
5. **Admin Tools**: Improve admin interface for unit management

## Support

For issues or questions about the multi-unit system:
1. Check the demo page at `/multi-unit-demo`
2. Review API documentation
3. Test with the provided examples
4. Check console logs for debugging information

---

*This multi-unit system provides a flexible foundation for complex product configurations while maintaining a smooth user experience.*