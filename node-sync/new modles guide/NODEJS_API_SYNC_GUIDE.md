# Node.js API Synchronization Guide

## Multi-Units & Pricelist Features Sync Guide

This guide covers synchronization of the new multi-units and pricelist features.

## New Models to Sync

### 1. Product Barcode Units (product.barcode.unit)

New model with fields:
- id, name, sequence
- product_id, product_tmpl_id  
- barcode, quantity, unit
- price, av_cost, purchase_qty, purchase_cost, sales_vat, sale_qty
- company_id, currency_id, active
- create_date, write_date

### 2. Enhanced Product Model

New fields added:
- barcode_unit_ids (array of unit IDs)
- barcode_unit_count (computed count)

### 3. Enhanced Pricelist Items

New fields added:
- barcode_unit_id (specific unit for pricing)
- max_quantity (maximum quantity limit)

## API Endpoints

### Barcode Units
- GET /api/product.barcode.unit
- POST /api/product.barcode.unit
- PUT /api/product.barcode.unit/{id}
- DELETE /api/product.barcode.unit/{id}

### Enhanced Product Endpoints
- GET /api/product.product/{id}?include=barcode_unit_ids
- GET /api/product.product/{id}/barcode_units

### Enhanced Pricelist Endpoints
- GET /api/product.pricelist.item (includes new fields)
- POST /api/product.pricelist.item (with barcode_unit_id, max_quantity)

## Sync Strategy

1. Initial sync of all barcode units
2. Update products with barcode unit relationships
3. Sync enhanced pricelist items with new fields
4. Set up real-time webhooks for changes
5. Implement delta sync for incremental updates

## Implementation Notes

- Barcode units have unique barcodes across all products
- Pricelist items with barcode_unit_id only apply to that specific unit
- Max quantity limits rule applicability
- Products can have multiple barcode units with different pricing
- Stock management works through base product (storable type required)

## 🎯 Overview

This guide covers the API synchronization requirements for the two new features implemented in Odoo:

1. **Multi-Units Support** (`product_multi_barcode` module)
2. **Pricelist Multi-Units Support** with max quantity functionality

## 📊 Database Models & Fields

### 1. Product Barcode Units (`product.barcode.unit`)

**New Model**: This is a completely new model that needs to be synced.

#### Core Fields
```javascript
{
  // Identification
  id: Number,                    // Odoo record ID
  name: String,                  // Unit name (e.g., "CTN 12", "Box", "Pack")
  sequence: Number,              // Display order (default: 10)
  
  // Product Relations
  product_id: [Number, String],  // [ID, "Product Name"] - Required
  product_tmpl_id: [Number, String], // [ID, "Template Name"] - Auto-computed
  
  // Barcode & Quantity
  barcode: String,               // Unique barcode for this unit
  quantity: Number,              // Base units contained (e.g., 12 for CTN 12)
  unit: [Number, String],        // [ID, "Unit Name"] - Related to product UoM
  
  // Pricing Fields
  price: Number,                 // Sales price for this unit
  av_cost: Number,               // Average cost for this unit
  purchase_qty: Number,          // Purchase quantity
  purchase_cost: Number,         // Total purchase cost
  sales_vat: Number,             // Sales price including VAT
  sale_qty: Number,              // Sale quantity
  
  // System Fields
  company_id: [Number, String],  // Company
  currency_id: [Number, String], // Currency
  active: Boolean,               // Active status (default: true)
  
  // Timestamps
  create_date: String,           // ISO datetime
  write_date: String,            // ISO datetime
  __last_update: String          // Last sync timestamp
}
```

#### API Endpoints Required

```javascript
// GET - Fetch all barcode units
GET /api/product.barcode.unit
// Optional filters: product_id, active, barcode

// GET - Fetch specific barcode unit
GET /api/product.barcode.unit/{id}

// POST - Create new barcode unit
POST /api/product.barcode.unit
{
  "name": "CTN 12",
  "product_id": 123,
  "barcode": "1234567890123",
  "quantity": 12.0,
  "price": 120.00,
  "av_cost": 84.00
}

// PUT - Update barcode unit
PUT /api/product.barcode.unit/{id}

// DELETE - Delete barcode unit
DELETE /api/product.barcode.unit/{id}
```

### 2. Product Extensions (`product.product`)

**Extended Fields**: These fields are added to existing product model.

#### New Fields to Sync
```javascript
{
  // Existing product fields...
  
  // New Multi-Unit Fields
  barcode_unit_ids: [Number],    // Array of barcode unit IDs
  barcode_unit_count: Number,    // Count of barcode units (computed)
  
  // Stock Import Fields (virtual - for import only)
  stock_quantity_import: Number, // For updating stock quantities
  quantity_on_hand: Number,      // Alternative import field
}
```

#### Enhanced API Endpoints
```javascript
// GET - Include barcode units in product fetch
GET /api/product.product/{id}?include=barcode_unit_ids

// Response includes:
{
  "id": 123,
  "name": "Coca Cola 500ml",
  "barcode_unit_ids": [45, 46, 47],
  "barcode_unit_count": 3,
  // ... other product fields
}

// GET - Fetch product with full barcode unit details
GET /api/product.product/{id}/barcode_units

// Response:
{
  "product": { /* product data */ },
  "barcode_units": [
    {
      "id": 45,
      "name": "Single Bottle",
      "barcode": "1234567890123",
      "quantity": 1.0,
      "price": 1.50
    },
    // ... more units
  ]
}
```

### 3. Pricelist Items Extensions (`product.pricelist.item`)

**Extended Fields**: These fields are added to existing pricelist item model.

#### New Fields to Sync
```javascript
{
  // Existing pricelist item fields...
  
  // New Multi-Unit Fields
  barcode_unit_id: [Number, String], // [ID, "Unit Name"] - Optional
  max_quantity: Number,               // Maximum quantity limit
  
  // Helper Fields
  available_barcode_unit_ids: [Number], // Available units for product (computed)
}
```

#### Enhanced Pricelist API
```javascript
// GET - Fetch pricelist items with multi-unit support
GET /api/product.pricelist.item?pricelist_id={id}

// Response includes new fields:
{
  "id": 789,
  "pricelist_id": [1, "Public Pricelist"],
  "product_tmpl_id": [123, "Coca Cola 500ml"],
  "barcode_unit_id": [45, "Single Bottle"], // NEW
  "min_quantity": 1.0,
  "max_quantity": 100.0,                    // NEW
  "fixed_price": 1.50,
  // ... other fields
}

// POST - Create pricelist item with multi-unit
POST /api/product.pricelist.item
{
  "pricelist_id": 1,
  "product_tmpl_id": 123,
  "barcode_unit_id": 45,     // NEW: Specific unit
  "min_quantity": 1.0,
  "max_quantity": 50.0,      // NEW: Max quantity
  "fixed_price": 1.40,       // Discounted price for this unit
  "applied_on": "1_product",
  "compute_price": "fixed"
}
```

## 🔄 Synchronization Strategy

### 1. Initial Data Sync

#### Step 1: Sync Barcode Units
```javascript
async function syncBarcodeUnits() {
  const response = await odooAPI.get('/api/product.barcode.unit', {
    params: {
      fields: [
        'id', 'name', 'sequence', 'product_id', 'product_tmpl_id',
        'barcode', 'quantity', 'unit', 'price', 'av_cost',
        'purchase_qty', 'purchase_cost', 'sales_vat', 'sale_qty',
        'company_id', 'currency_id', 'active',
        'create_date', 'write_date', '__last_update'
      ]
    }
  });
  
  for (const unit of response.data) {
    await upsertBarcodeUnit(unit);
  }
}
```

#### Step 2: Update Product Records
```javascript
async function updateProductsWithBarcodeUnits() {
  const response = await odooAPI.get('/api/product.product', {
    params: {
      fields: [
        'id', 'barcode_unit_ids', 'barcode_unit_count',
        'stock_quantity_import', 'quantity_on_hand'
      ]
    }
  });
  
  for (const product of response.data) {
    await updateProductBarcodeUnits(product);
  }
}
```

#### Step 3: Sync Enhanced Pricelist Items
```javascript
async function syncPricelistItems() {
  const response = await odooAPI.get('/api/product.pricelist.item', {
    params: {
      fields: [
        'id', 'pricelist_id', 'product_tmpl_id', 'product_id',
        'barcode_unit_id', 'min_quantity', 'max_quantity',
        'fixed_price', 'applied_on', 'compute_price',
        'date_start', 'date_end', 'active'
      ]
    }
  });
  
  for (const item of response.data) {
    await upsertPricelistItem(item);
  }
}
```

### 2. Real-time Sync (Webhooks/Polling)

#### Monitor These Models
```javascript
const modelsToMonitor = [
  'product.barcode.unit',      // New model
  'product.product',           // For barcode_unit_ids changes
  'product.pricelist.item'     // For barcode_unit_id, max_quantity changes
];

async function handleWebhook(model, recordId, action) {
  switch (model) {
    case 'product.barcode.unit':
      await syncSingleBarcodeUnit(recordId, action);
      break;
      
    case 'product.product':
      await syncProductBarcodeUnits(recordId);
      break;
      
    case 'product.pricelist.item':
      await syncSinglePricelistItem(recordId, action);
      break;
  }
}
```

### 3. Delta Sync (Incremental Updates)

#### Track Last Sync Timestamps
```javascript
async function deltaSyncBarcodeUnits(lastSyncTime) {
  const response = await odooAPI.get('/api/product.barcode.unit', {
    params: {
      filters: [['write_date', '>', lastSyncTime]],
      fields: ['id', 'name', 'barcode', 'quantity', 'price', 'write_date']
    }
  });
  
  return response.data;
}
```

## 🛠️ Implementation Examples

### 1. Node.js Data Models

#### Barcode Unit Model
```javascript
// models/BarcodeUnit.js
const mongoose = require('mongoose');

const barcodeUnitSchema = new mongoose.Schema({
  odooId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  sequence: { type: Number, default: 10 },
  
  // Product Relations
  productId: { type: Number, required: true },
  productTmplId: { type: Number },
  
  // Barcode & Quantity
  barcode: { type: String, unique: true, sparse: true },
  quantity: { type: Number, required: true, default: 1.0 },
  unit: { type: String },
  
  // Pricing
  price: { type: Number, default: 0 },
  avCost: { type: Number, default: 0 },
  purchaseQty: { type: Number, default: 0 },
  purchaseCost: { type: Number, default: 0 },
  salesVat: { type: Number, default: 0 },
  saleQty: { type: Number, default: 0 },
  
  // System
  companyId: { type: Number },
  currencyId: { type: Number },
  active: { type: Boolean, default: true },
  
  // Sync tracking
  lastSyncDate: { type: Date, default: Date.now },
  odooCreateDate: { type: Date },
  odooWriteDate: { type: Date }
});

module.exports = mongoose.model('BarcodeUnit', barcodeUnitSchema);
```

#### Enhanced Product Model
```javascript
// models/Product.js - Add these fields to existing model
const productSchema = new mongoose.Schema({
  // ... existing product fields
  
  // New Multi-Unit Fields
  barcodeUnitIds: [{ type: Number }],
  barcodeUnitCount: { type: Number, default: 0 },
  
  // Virtual stock fields (not stored)
  stockQuantityImport: { type: Number },
  quantityOnHand: { type: Number }
});

// Virtual populate for barcode units
productSchema.virtual('barcodeUnits', {
  ref: 'BarcodeUnit',
  localField: 'odooId',
  foreignField: 'productId'
});
```

#### Enhanced Pricelist Item Model
```javascript
// models/PricelistItem.js - Add these fields
const pricelistItemSchema = new mongoose.Schema({
  // ... existing pricelist item fields
  
  // New Multi-Unit Fields
  barcodeUnitId: { type: Number },
  barcodeUnitName: { type: String },
  maxQuantity: { type: Number },
  availableBarcodeUnitIds: [{ type: Number }]
});
```

### 2. API Service Functions

#### Barcode Unit Service
```javascript
// services/BarcodeUnitService.js
class BarcodeUnitService {
  
  async syncFromOdoo(odooId = null) {
    const filter = odooId ? `/${odooId}` : '';
    const response = await this.odooAPI.get(`/api/product.barcode.unit${filter}`);
    
    if (Array.isArray(response.data)) {
      for (const unit of response.data) {
        await this.upsertBarcodeUnit(unit);
      }
    } else {
      await this.upsertBarcodeUnit(response.data);
    }
  }
  
  async upsertBarcodeUnit(odooData) {
    const barcodeUnit = await BarcodeUnit.findOneAndUpdate(
      { odooId: odooData.id },
      {
        odooId: odooData.id,
        name: odooData.name,
        sequence: odooData.sequence,
        productId: Array.isArray(odooData.product_id) ? odooData.product_id[0] : odooData.product_id,
        productTmplId: Array.isArray(odooData.product_tmpl_id) ? odooData.product_tmpl_id[0] : odooData.product_tmpl_id,
        barcode: odooData.barcode,
        quantity: odooData.quantity,
        unit: Array.isArray(odooData.unit) ? odooData.unit[1] : odooData.unit,
        price: odooData.price,
        avCost: odooData.av_cost,
        purchaseQty: odooData.purchase_qty,
        purchaseCost: odooData.purchase_cost,
        salesVat: odooData.sales_vat,
        saleQty: odooData.sale_qty,
        companyId: Array.isArray(odooData.company_id) ? odooData.company_id[0] : odooData.company_id,
        currencyId: Array.isArray(odooData.currency_id) ? odooData.currency_id[0] : odooData.currency_id,
        active: odooData.active,
        lastSyncDate: new Date(),
        odooCreateDate: new Date(odooData.create_date),
        odooWriteDate: new Date(odooData.write_date)
      },
      { upsert: true, new: true }
    );
    
    return barcodeUnit;
  }
  
  async createInOdoo(barcodeUnitData) {
    const response = await this.odooAPI.post('/api/product.barcode.unit', {
      name: barcodeUnitData.name,
      product_id: barcodeUnitData.productId,
      barcode: barcodeUnitData.barcode,
      quantity: barcodeUnitData.quantity,
      price: barcodeUnitData.price,
      av_cost: barcodeUnitData.avCost,
      sequence: barcodeUnitData.sequence
    });
    
    return response.data;
  }
  
  async findByBarcode(barcode) {
    return await BarcodeUnit.findOne({ barcode, active: true });
  }
  
  async findByProduct(productId) {
    return await BarcodeUnit.find({ productId, active: true }).sort({ sequence: 1 });
  }
}
```

#### Enhanced Product Service
```javascript
// services/ProductService.js - Add these methods
class ProductService {
  
  async syncBarcodeUnits(productId) {
    const response = await this.odooAPI.get(`/api/product.product/${productId}`, {
      params: {
        fields: ['barcode_unit_ids', 'barcode_unit_count']
      }
    });
    
    await Product.findOneAndUpdate(
      { odooId: productId },
      {
        barcodeUnitIds: response.data.barcode_unit_ids,
        barcodeUnitCount: response.data.barcode_unit_count
      }
    );
  }
  
  async getProductWithBarcodeUnits(productId) {
    const product = await Product.findOne({ odooId: productId }).populate('barcodeUnits');
    return product;
  }
  
  async updateStockQuantity(productId, quantity) {
    const response = await this.odooAPI.put(`/api/product.product/${productId}`, {
      stock_quantity_import: quantity
    });
    
    return response.data;
  }
}
```

#### Enhanced Pricelist Service
```javascript
// services/PricelistService.js - Add these methods
class PricelistService {
  
  async syncPricelistItems(pricelistId = null) {
    const filter = pricelistId ? { pricelist_id: pricelistId } : {};
    const response = await this.odooAPI.get('/api/product.pricelist.item', {
      params: {
        filters: Object.entries(filter).map(([key, value]) => [key, '=', value]),
        fields: [
          'id', 'pricelist_id', 'product_tmpl_id', 'product_id',
          'barcode_unit_id', 'min_quantity', 'max_quantity',
          'fixed_price', 'applied_on', 'compute_price',
          'date_start', 'date_end', 'active'
        ]
      }
    });
    
    for (const item of response.data) {
      await this.upsertPricelistItem(item);
    }
  }
  
  async createPricelistItemWithUnit(data) {
    const response = await this.odooAPI.post('/api/product.pricelist.item', {
      pricelist_id: data.pricelistId,
      product_tmpl_id: data.productTmplId,
      barcode_unit_id: data.barcodeUnitId, // NEW
      min_quantity: data.minQuantity,
      max_quantity: data.maxQuantity,      // NEW
      fixed_price: data.fixedPrice,
      applied_on: '1_product',
      compute_price: 'fixed'
    });
    
    return response.data;
  }
  
  async getPriceForBarcodeUnit(pricelistId, productId, barcodeUnitId, quantity) {
    // Custom endpoint or logic to get price for specific barcode unit
    const response = await this.odooAPI.post('/api/product.pricelist/get_price', {
      pricelist_id: pricelistId,
      product_id: productId,
      barcode_unit_id: barcodeUnitId,
      quantity: quantity
    });
    
    return response.data.price;
  }
}
```

## 🔍 Testing & Validation

### 1. Data Integrity Checks

```javascript
// tests/syncValidation.js
async function validateBarcodeUnitSync() {
  // Check barcode uniqueness
  const duplicateBarcodes = await BarcodeUnit.aggregate([
    { $group: { _id: "$barcode", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicateBarcodes.length > 0) {
    console.error('Duplicate barcodes found:', duplicateBarcodes);
  }
  
  // Check product relationships
  const orphanedUnits = await BarcodeUnit.find({
    productId: { $nin: await Product.distinct('odooId') }
  });
  
  if (orphanedUnits.length > 0) {
    console.error('Orphaned barcode units found:', orphanedUnits.length);
  }
}

async function validatePricelistSync() {
  // Check max quantity > min quantity
  const invalidRanges = await PricelistItem.find({
    maxQuantity: { $exists: true, $gt: 0 },
    $expr: { $lt: ["$maxQuantity", "$minQuantity"] }
  });
  
  if (invalidRanges.length > 0) {
    console.error('Invalid quantity ranges found:', invalidRanges.length);
  }
}
```

### 2. API Testing

```javascript
// tests/apiTests.js
describe('Multi-Unit API Sync', () => {
  
  test('should sync barcode units correctly', async () => {
    const barcodeUnitService = new BarcodeUnitService();
    await barcodeUnitService.syncFromOdoo();
    
    const units = await BarcodeUnit.find();
    expect(units.length).toBeGreaterThan(0);
    
    // Verify required fields
    units.forEach(unit => {
      expect(unit.name).toBeDefined();
      expect(unit.productId).toBeDefined();
      expect(unit.quantity).toBeGreaterThan(0);
    });
  });
  
  test('should handle pricelist items with barcode units', async () => {
    const pricelistService = new PricelistService();
    await pricelistService.syncPricelistItems();
    
    const itemsWithUnits = await PricelistItem.find({
      barcodeUnitId: { $exists: true, $ne: null }
    });
    
    expect(itemsWithUnits.length).toBeGreaterThan(0);
  });
});
```

## 🚀 Deployment Checklist

### 1. Database Migration
- [ ] Create new `barcode_units` collection/table
- [ ] Add new fields to `products` collection
- [ ] Add new fields to `pricelist_items` collection
- [ ] Create indexes for performance

### 2. API Updates
- [ ] Update product endpoints to include barcode units
- [ ] Add barcode unit CRUD endpoints
- [ ] Update pricelist endpoints for multi-unit support
- [ ] Add bulk sync endpoints

### 3. Sync Configuration
- [ ] Configure webhook endpoints for new models
- [ ] Update polling intervals for delta sync
- [ ] Set up monitoring for sync failures
- [ ] Configure retry logic for failed syncs

### 4. Performance Optimization
- [ ] Add database indexes for barcode lookups
- [ ] Implement caching for frequently accessed barcode units
- [ ] Optimize bulk sync operations
- [ ] Monitor API response times

## 📈 Monitoring & Maintenance

### 1. Sync Health Monitoring
```javascript
async function checkSyncHealth() {
  const lastSync = await SyncLog.findOne().sort({ timestamp: -1 });
  const syncAge = Date.now() - lastSync.timestamp;
  
  if (syncAge > 30 * 60 * 1000) { // 30 minutes
    console.warn('Sync is behind schedule');
  }
  
  // Check for failed syncs
  const failedSyncs = await SyncLog.find({
    status: 'failed',
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  if (failedSyncs.length > 10) {
    console.error('High number of failed syncs:', failedSyncs.length);
  }
}
```

### 2. Data Quality Monitoring
```javascript
async function monitorDataQuality() {
  // Check for products without barcode units
  const productsWithoutUnits = await Product.find({
    barcodeUnitCount: 0,
    active: true
  });
  
  // Check for barcode units with zero prices
  const unitsWithZeroPrices = await BarcodeUnit.find({
    price: 0,
    active: true
  });
  
  // Report issues
  console.log(`Products without barcode units: ${productsWithoutUnits.length}`);
  console.log(`Barcode units with zero prices: ${unitsWithZeroPrices.length}`);
}
```

This comprehensive guide should help your Node.js application properly sync and utilize the new multi-units and enhanced pricelist features. The key is to implement the sync incrementally, test thoroughly, and monitor the data quality continuously. 
