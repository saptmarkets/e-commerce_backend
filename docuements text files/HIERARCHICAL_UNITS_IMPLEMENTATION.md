# Hierarchical Unit System Implementation

## Overview

This document outlines the implementation of a hierarchical unit management system for the SaptMarkets application. The system replaces the previous flat unit structure with a more flexible parent-child relationship model.

## Key Features

### 1. Hierarchical Unit Structure
- **Parent Units (Basic Units)**: Core measurement units like "Piece", "Gram", "Liter"
- **Child Units (Multi Units)**: Derived units with pack values like "Dozen" (12 pieces), "Kilogram" (1000 grams)

### 2. Product Unit Management
- Each product can have multiple unit configurations
- Flexible pricing per unit configuration
- Stock management in terms of basic units
- Automatic conversion calculations

### 3. Enhanced Admin Interface
- Improved unit management with hierarchical display
- Product units manager for configuring product-specific units
- Real-time price comparisons and savings calculations

## Database Schema Changes

### Unit Model Updates
```javascript
{
  name: String,           // Unit name (e.g., "Piece", "Dozen")
  shortCode: String,      // Short code (e.g., "pcs", "dz")
  description: String,    // Optional description
  type: String,           // Unit type (weight, volume, count, etc.)
  isParent: Boolean,      // True for basic units
  parentUnit: ObjectId,   // Reference to parent unit (for child units)
  packValue: Number,      // Conversion factor (e.g., 12 for dozen)
  conversionFactor: Number, // Additional conversion factor
  status: String,         // 'show' or 'hide'
  sortOrder: Number       // Display order
}
```

### Product Model Updates
```javascript
{
  // ... existing fields ...
  basicUnit: ObjectId,    // Reference to the basic unit
  basicUnitType: String,  // DEPRECATED - kept for migration
  // ... other fields ...
}
```

### ProductUnit Model (New)
```javascript
{
  productId: ObjectId,        // Reference to product
  unitId: ObjectId,           // Reference to unit definition
  unitValue: Number,          // Multiplier (e.g., 2 for "2x Dozen")
  price: Number,              // Price for this unit configuration
  originalPrice: Number,      // Original price (for discounts)
  sku: String,                // Optional SKU
  barcode: String,            // Optional barcode
  isDefault: Boolean,         // Default unit for the product
  isActive: Boolean,          // Active status
  // ... additional fields for stock, dimensions, etc.
}
```

## Migration Process

### Prerequisites
1. **Backup your database** before running any migration
2. Test the migration on a staging environment first
3. Ensure all dependencies are installed

### Running the Migration

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Update the MongoDB connection string** in `migration-script.js`:
   ```javascript
   const MONGO_URI = 'your-mongodb-connection-string';
   ```

4. **Review and customize unit mappings** in the migration script based on your existing data

5. **Run the migration script**:
   ```bash
   node migration-script.js
   ```

### Migration Phases

The migration script runs in several phases:

1. **Phase 1**: Create core parent units (Piece, Gram, Kilogram, etc.)
2. **Phase 2**: Restructure existing global units into hierarchical structure
3. **Phase 3**: Migrate product data to use new `basicUnit` field
4. **Phase 4**: Convert `multiUnits` arrays to `ProductUnit` documents
5. **Phase 5**: Final review and cleanup

### Post-Migration Verification

After running the migration:

1. Check the console output for any warnings or errors
2. Verify that products have correct `basicUnit` assignments
3. Ensure ProductUnit entries are created properly
4. Test the admin interface to confirm everything works

## API Endpoints

### Unit Management
- `GET /api/units/basic` - Get all basic (parent) units
- `GET /api/units/multi/:parentUnitId` - Get child units for a parent
- `GET /api/units/compatible/:basicUnitId` - Get compatible units for a basic unit
- `GET /api/units/grouped` - Get units grouped by hierarchy

### Product Unit Management
- `GET /api/product-units/product/:productId` - Get all units for a product
- `POST /api/product-units/product/:productId` - Create a new product unit
- `PUT /api/product-units/product/:productId/unit/:unitId` - Update a product unit
- `DELETE /api/product-units/product/:productId/unit/:unitId` - Delete a product unit
- `GET /api/product-units/product/:productId/best-value` - Get best value unit
- `GET /api/product-units/product/:productId/compare` - Compare unit pricing

## Frontend Components

### New Components Added

1. **ProductUnitsManager** (`admin/src/components/product/ProductUnitsManager.jsx`)
   - Comprehensive product unit management interface
   - Add, edit, delete product units
   - Real-time price calculations and comparisons

2. **ProductUnitServices** (`admin/src/services/ProductUnitServices.js`)
   - API service layer for product unit operations
   - Handles all CRUD operations for product units

### Updated Components

1. **ProductDrawer** - Integrated ProductUnitsManager in the "Multi Units" tab
2. **UnitServices** - Added `getCompatibleUnits` method
3. **UnitTable** - Enhanced to display hierarchical unit structure
4. **UnitDrawer** - Already supports hierarchical unit creation

## Usage Guide

### Creating Units

1. **Create Parent Units**:
   - Go to Units management
   - Add basic units like "Piece", "Gram", "Liter"
   - Set `isParent: true`

2. **Create Child Units**:
   - Select a parent unit
   - Set pack value (e.g., 12 for dozen)
   - System automatically calculates conversions

### Managing Product Units

1. **Set Basic Unit**:
   - In product creation/editing, select the basic unit
   - This determines the base measurement for stock

2. **Add Unit Configurations**:
   - Use the "Multi Units" tab in product drawer
   - Add different selling units with specific prices
   - Set one as default for the product

3. **Price Management**:
   - Set individual prices for each unit configuration
   - System shows price per basic unit for comparison
   - Automatic savings calculations

## Troubleshooting

### Common Issues

1. **Migration Fails**:
   - Check MongoDB connection string
   - Ensure sufficient database permissions
   - Review console output for specific errors

2. **Units Not Displaying**:
   - Verify unit status is 'show'
   - Check parent-child relationships
   - Ensure proper population in queries

3. **Product Units Not Loading**:
   - Confirm product has a valid `basicUnit`
   - Check API endpoint responses
   - Verify ProductUnit documents exist

### Debug Steps

1. Check browser console for JavaScript errors
2. Monitor network tab for failed API requests
3. Review server logs for backend errors
4. Verify database document structure

## Best Practices

### Unit Creation
- Use consistent naming conventions
- Set appropriate pack values for child units
- Maintain logical hierarchies (don't create overly complex structures)

### Product Management
- Always set a basic unit for products
- Create default product units for common selling configurations
- Use meaningful SKUs and barcodes for inventory tracking

### Performance
- Use pagination for large product unit lists
- Implement caching for frequently accessed unit data
- Monitor database query performance

## Future Enhancements

### Planned Features
1. **Bulk Unit Operations**: Import/export unit configurations
2. **Advanced Pricing Rules**: Tier-based pricing, quantity discounts
3. **Inventory Integration**: Real-time stock updates across units
4. **Analytics Dashboard**: Unit performance metrics
5. **Mobile Optimization**: Responsive design improvements

### API Extensions
1. **Batch Operations**: Bulk create/update product units
2. **Search & Filtering**: Advanced unit search capabilities
3. **Validation Endpoints**: Real-time data validation
4. **Reporting APIs**: Unit usage and performance reports

## Support

For issues or questions regarding the hierarchical unit system:

1. Check this documentation first
2. Review the migration script logs
3. Test in a development environment
4. Contact the development team with specific error messages and steps to reproduce

## Version History

- **v1.0**: Initial hierarchical unit system implementation
- **v1.1**: Added ProductUnitsManager component
- **v1.2**: Enhanced migration script with better error handling
- **v1.3**: Added price comparison and savings calculations

---

**Note**: This implementation maintains backward compatibility where possible, but some legacy features may be deprecated. Always test thoroughly in a staging environment before deploying to production. 