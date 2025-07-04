# API Synchronization Guide for Multi-Units & Pricelist Features

## 🎯 Overview

This guide covers synchronizing two new Odoo features with your Node.js application:

1. **Multi-Units Support** (`product_multi_barcode` module)
2. **Enhanced Pricelist Support** with barcode units and max quantity

## 📊 New Models & Fields

### 1. Product Barcode Units (`product.barcode.unit`) - NEW MODEL

```json
{
  "id": 123,
  "name": "CTN 12",
  "sequence": 10,
  "product_id": [456, "Coca Cola 500ml"],
  "product_tmpl_id": [789, "Coca Cola 500ml"],
  "barcode": "1234567890123",
  "quantity": 12.0,
  "unit": [1, "Units"],
  "price": 18.00,
  "av_cost": 12.60,
  "purchase_qty": 12.0,
  "purchase_cost": 12.60,
  "sales_vat": 20.70,
  "sale_qty": 12.0,
  "company_id": [1, "My Company"],
  "currency_id": [1, "USD"],
  "active": true,
  "create_date": "2024-01-15 10:30:00",
  "write_date": "2024-01-15 10:30:00"
}
```

### 2. Enhanced Product Model - NEW FIELDS

```json
{
  "id": 456,
  "name": "Coca Cola 500ml",
  // ... existing fields ...
  
  // NEW FIELDS TO SYNC:
  "barcode_unit_ids": [123, 124, 125],
  "barcode_unit_count": 3
}
```

### 3. Enhanced Pricelist Items - NEW FIELDS

```json
{
  "id": 789,
  "pricelist_id": [1, "Public Pricelist"],
  "product_tmpl_id": [789, "Coca Cola 500ml"],
  // ... existing fields ...
  
  // NEW FIELDS TO SYNC:
  "barcode_unit_id": [123, "CTN 12"],
  "max_quantity": 100.0
}
```

## 🔌 API Endpoints

### Barcode Units CRUD

```javascript
// GET - Fetch all barcode units
GET /web/dataset/search_read
{
  "model": "product.barcode.unit",
  "fields": ["id", "name", "product_id", "barcode", "quantity", "price", "av_cost"],
  "domain": []
}

// GET - Fetch by product
GET /web/dataset/search_read
{
  "model": "product.barcode.unit",
  "fields": ["*"],
  "domain": [["product_id", "=", 456]]
}

// POST - Create barcode unit
POST /web/dataset/call_kw
{
  "model": "product.barcode.unit",
  "method": "create",
  "args": [{
    "name": "CTN 12",
    "product_id": 456,
    "barcode": "1234567890123",
    "quantity": 12.0,
    "price": 18.00
  }]
}

// PUT - Update barcode unit
POST /web/dataset/call_kw
{
  "model": "product.barcode.unit",
  "method": "write",
  "args": [[123], {"price": 19.00}]
}

// DELETE - Delete barcode unit
POST /web/dataset/call_kw
{
  "model": "product.barcode.unit",
  "method": "unlink",
  "args": [[123]]
}
```

### Enhanced Product Endpoints

```javascript
// GET - Product with barcode units
GET /web/dataset/search_read
{
  "model": "product.product",
  "fields": ["id", "name", "barcode_unit_ids", "barcode_unit_count"],
  "domain": [["id", "=", 456]]
}
```

### Enhanced Pricelist Endpoints

```javascript
// GET - Pricelist items with new fields
GET /web/dataset/search_read
{
  "model": "product.pricelist.item",
  "fields": ["id", "pricelist_id", "product_tmpl_id", "barcode_unit_id", "max_quantity", "fixed_price"],
  "domain": [["pricelist_id", "=", 1]]
}

// POST - Create pricelist item with barcode unit
POST /web/dataset/call_kw
{
  "model": "product.pricelist.item",
  "method": "create",
  "args": [{
    "pricelist_id": 1,
    "product_tmpl_id": 789,
    "barcode_unit_id": 123,
    "min_quantity": 1.0,
    "max_quantity": 50.0,
    "fixed_price": 17.50,
    "applied_on": "1_product",
    "compute_price": "fixed"
  }]
}
```

## 🔄 Sync Implementation

### 1. Initial Full Sync

```javascript
// Sync all barcode units
async function syncBarcodeUnits() {
  const response = await odoo.call({
    model: 'product.barcode.unit',
    method: 'search_read',
    args: [[], ['id', 'name', 'product_id', 'barcode', 'quantity', 'price', 'av_cost', 'write_date']]
  });
  
  for (const unit of response) {
    await database.upsert('barcode_units', {
      odoo_id: unit.id,
      name: unit.name,
      product_id: Array.isArray(unit.product_id) ? unit.product_id[0] : unit.product_id,
      barcode: unit.barcode,
      quantity: unit.quantity,
      price: unit.price,
      av_cost: unit.av_cost,
      last_sync: new Date()
    });
  }
}

// Update products with barcode unit relationships
async function updateProductBarcodeUnits() {
  const response = await odoo.call({
    model: 'product.product',
    method: 'search_read',
    args: [[], ['id', 'barcode_unit_ids', 'barcode_unit_count']]
  });
  
  for (const product of response) {
    await database.update('products', 
      { odoo_id: product.id },
      { 
        barcode_unit_ids: product.barcode_unit_ids,
        barcode_unit_count: product.barcode_unit_count
      }
    );
  }
}

// Sync enhanced pricelist items
async function syncPricelistItems() {
  const response = await odoo.call({
    model: 'product.pricelist.item',
    method: 'search_read',
    args: [[], ['id', 'pricelist_id', 'product_tmpl_id', 'barcode_unit_id', 'max_quantity', 'fixed_price']]
  });
  
  for (const item of response) {
    await database.upsert('pricelist_items', {
      odoo_id: item.id,
      pricelist_id: Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id,
      product_tmpl_id: Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id,
      barcode_unit_id: Array.isArray(item.barcode_unit_id) ? item.barcode_unit_id[0] : item.barcode_unit_id,
      max_quantity: item.max_quantity,
      fixed_price: item.fixed_price
    });
  }
}
```

### 2. Real-time Sync (Webhooks)

```javascript
// Webhook handler
app.post('/webhook/odoo', async (req, res) => {
  const { model, record_id, action } = req.body;
  
  try {
    switch (model) {
      case 'product.barcode.unit':
        await handleBarcodeUnitChange(record_id, action);
        break;
      case 'product.product':
        await handleProductChange(record_id);
        break;
      case 'product.pricelist.item':
        await handlePricelistItemChange(record_id, action);
        break;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function handleBarcodeUnitChange(recordId, action) {
  if (action === 'delete') {
    await database.delete('barcode_units', { odoo_id: recordId });
  } else {
    const response = await odoo.call({
      model: 'product.barcode.unit',
      method: 'read',
      args: [[recordId], ['*']]
    });
    if (response.length > 0) {
      await syncSingleBarcodeUnit(response[0]);
    }
  }
}
```

### 3. Delta Sync (Incremental)

```javascript
// Run every 5 minutes
async function deltaSyncBarcodeUnits() {
  const lastSync = await getLastSyncTime('barcode_units');
  
  const response = await odoo.call({
    model: 'product.barcode.unit',
    method: 'search_read',
    args: [
      [['write_date', '>', lastSync]],
      ['*']
    ]
  });
  
  for (const unit of response) {
    await syncSingleBarcodeUnit(unit);
  }
  
  await updateLastSyncTime('barcode_units', new Date());
}
```

## 💾 Database Schema

### New Table: barcode_units

```sql
CREATE TABLE barcode_units (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sequence INTEGER DEFAULT 10,
  product_id INTEGER NOT NULL,
  product_tmpl_id INTEGER,
  barcode VARCHAR(255) UNIQUE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  unit_name VARCHAR(100),
  price DECIMAL(10,2) DEFAULT 0,
  av_cost DECIMAL(10,2) DEFAULT 0,
  purchase_qty DECIMAL(10,2) DEFAULT 0,
  purchase_cost DECIMAL(10,2) DEFAULT 0,
  sales_vat DECIMAL(10,2) DEFAULT 0,
  sale_qty DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_barcode_units_product (product_id),
  INDEX idx_barcode_units_barcode (barcode),
  INDEX idx_barcode_units_active (active)
);
```

### Enhanced Tables

```sql
-- Add to products table
ALTER TABLE products 
ADD COLUMN barcode_unit_ids JSON,
ADD COLUMN barcode_unit_count INTEGER DEFAULT 0;

-- Add to pricelist_items table
ALTER TABLE pricelist_items 
ADD COLUMN barcode_unit_id INTEGER,
ADD COLUMN max_quantity DECIMAL(10,2);
```

## 🛠️ Service Classes

```javascript
// BarcodeUnitService.js
class BarcodeUnitService {
  async findByBarcode(barcode) {
    return await this.db.query(
      'SELECT * FROM barcode_units WHERE barcode = ? AND active = true',
      [barcode]
    );
  }
  
  async findByProduct(productId) {
    return await this.db.query(
      'SELECT * FROM barcode_units WHERE product_id = ? AND active = true ORDER BY sequence',
      [productId]
    );
  }
  
  async createInOdoo(data) {
    const result = await this.odoo.call({
      model: 'product.barcode.unit',
      method: 'create',
      args: [data]
    });
    
    await this.syncFromOdoo(result);
    return result;
  }
  
  async getPriceForUnit(pricelistId, barcodeUnitId, quantity) {
    // Get price from pricelist for specific barcode unit
    const priceRule = await this.db.query(`
      SELECT fixed_price FROM pricelist_items 
      WHERE pricelist_id = ? 
        AND barcode_unit_id = ?
        AND min_quantity <= ?
        AND (max_quantity IS NULL OR max_quantity >= ?)
        AND active = true
      ORDER BY min_quantity DESC
      LIMIT 1
    `, [pricelistId, barcodeUnitId, quantity, quantity]);
    
    if (priceRule.length > 0) {
      return priceRule[0].fixed_price;
    }
    
    // Fallback to unit's base price
    const unit = await this.db.query(
      'SELECT price FROM barcode_units WHERE odoo_id = ?',
      [barcodeUnitId]
    );
    
    return unit.length > 0 ? unit[0].price : 0;
  }
}
```

## 📋 API Routes

```javascript
// routes/barcodeUnits.js
const express = require('express');
const router = express.Router();

// GET /api/barcode-units
router.get('/', async (req, res) => {
  const { product_id, barcode, active = true } = req.query;
  
  let query = 'SELECT * FROM barcode_units WHERE 1=1';
  const params = [];
  
  if (product_id) {
    query += ' AND product_id = ?';
    params.push(product_id);
  }
  
  if (barcode) {
    query += ' AND barcode = ?';
    params.push(barcode);
  }
  
  query += ' AND active = ? ORDER BY sequence, id';
  params.push(active === 'true');
  
  const units = await db.query(query, params);
  res.json(units);
});

// GET /api/products/:id/barcode-units
router.get('/products/:id/barcode-units', async (req, res) => {
  const units = await db.query(
    'SELECT * FROM barcode_units WHERE product_id = ? AND active = true ORDER BY sequence',
    [req.params.id]
  );
  res.json(units);
});

// POST /api/barcode-units
router.post('/', async (req, res) => {
  const barcodeUnitService = new BarcodeUnitService(odoo, db);
  const result = await barcodeUnitService.createInOdoo(req.body);
  res.status(201).json({ odoo_id: result });
});

module.exports = router;
```

## 🔍 Testing

```javascript
// Test barcode unit sync
describe('Barcode Unit Sync', () => {
  test('should sync barcode units correctly', async () => {
    await syncBarcodeUnits();
    const units = await db.query('SELECT * FROM barcode_units');
    expect(units.length).toBeGreaterThan(0);
  });
  
  test('should find unit by barcode', async () => {
    const service = new BarcodeUnitService(odoo, db);
    const unit = await service.findByBarcode('1234567890123');
    expect(unit).toBeDefined();
    expect(unit.barcode).toBe('1234567890123');
  });
});
```

## 🚀 Deployment Steps

1. **Update database schema** with new tables and fields
2. **Deploy application code** with new API endpoints
3. **Configure webhooks** in Odoo for real-time sync
4. **Run initial sync** to populate barcode units
5. **Test API endpoints** and sync functionality
6. **Monitor sync performance** and data integrity

## 📈 Key Benefits

- **Multiple packaging units** per product with individual pricing
- **Advanced pricelist rules** targeting specific barcode units
- **Quantity-based pricing** with min/max limits
- **Real-time synchronization** for immediate updates
- **Flexible inventory management** through base products

This guide provides everything needed to synchronize the new multi-units and enhanced pricelist features with your Node.js application. 