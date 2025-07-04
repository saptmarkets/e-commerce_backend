# Comprehensive API Synchronization Guide
## Multi-Units & Enhanced Pricelist Features

### 🎯 Executive Summary

Your Odoo system now has two major new features that require API synchronization:

1. **Multi-Units Support**: Products can have multiple barcode units (e.g., single bottle, 6-pack, carton)
2. **Enhanced Pricelists**: Pricelist rules can target specific barcode units with max quantity limits

## 📊 New Data Models

### 1. Product Barcode Units (`product.barcode.unit`)

**Completely new model** - requires full CRUD synchronization.

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

### 2. Enhanced Product Model

**New fields added** to existing `product.product` model:

```json
{
  "id": 456,
  "name": "Coca Cola 500ml",
  // ... existing product fields ...
  
  // NEW FIELDS:
  "barcode_unit_ids": [123, 124, 125],
  "barcode_unit_count": 3,
  "stock_quantity_import": null,  // Virtual field for stock updates
  "quantity_on_hand": null        // Alternative import field
}
```

### 3. Enhanced Pricelist Items

**New fields added** to existing `product.pricelist.item` model:

```json
{
  "id": 789,
  "pricelist_id": [1, "Public Pricelist"],
  "product_tmpl_id": [789, "Coca Cola 500ml"],
  "product_id": false,
  // ... existing pricelist fields ...
  
  // NEW FIELDS:
  "barcode_unit_id": [123, "CTN 12"],
  "max_quantity": 100.0,
  "available_barcode_unit_ids": [123, 124, 125]
}
```

## 🔌 API Endpoints

### Barcode Units API

```javascript
// GET - List all barcode units
GET /web/dataset/search_read
{
  "model": "product.barcode.unit",
  "fields": ["id", "name", "sequence", "product_id", "barcode", "quantity", "price", "av_cost"],
  "domain": [],
  "limit": 1000
}

// GET - Get specific barcode unit
GET /web/dataset/search_read
{
  "model": "product.barcode.unit",
  "fields": ["*"],
  "domain": [["id", "=", 123]]
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
    "quantity": 12.0
  }]
}

// PUT - Update barcode unit
POST /web/dataset/call_kw
{
  "model": "product.barcode.unit",
  "method": "write",
  "args": [
    [123],
    {
      "name": "CTN 12 Updated",
      "price": 19.00
    }
  ]
}

// DELETE - Delete barcode unit
POST /web/dataset/call_kw
{
  "model": "product.barcode.unit",
  "method": "unlink",
  "args": [[123]]
}
```

### Enhanced Product API

```javascript
// GET - Product with barcode units
GET /web/dataset/search_read
{
  "model": "product.product",
  "fields": ["id", "name", "barcode_unit_ids", "barcode_unit_count"],
  "domain": [["id", "=", 456]]
}

// GET - Product barcode units details
GET /web/dataset/search_read
{
  "model": "product.barcode.unit",
  "fields": ["*"],
  "domain": [["product_id", "=", 456]]
}
```

### Enhanced Pricelist API

```javascript
// GET - Pricelist items with multi-unit support
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

## 🔄 Synchronization Strategy

### Phase 1: Initial Full Sync

```javascript
// 1. Sync all barcode units
async function syncBarcodeUnits() {
  const response = await odoo.call({
    model: 'product.barcode.unit',
    method: 'search_read',
    args: [[], ['id', 'name', 'product_id', 'barcode', 'quantity', 'price']]
  });
  
  for (const unit of response) {
    await database.upsert('barcode_units', {
      odoo_id: unit.id,
      name: unit.name,
      product_id: Array.isArray(unit.product_id) ? unit.product_id[0] : unit.product_id,
      barcode: unit.barcode,
      quantity: unit.quantity,
      price: unit.price
    });
  }
}
```

### Phase 2: Real-time Sync (Webhooks)

```javascript
// Webhook handler for model changes
app.post('/webhook/odoo', async (req, res) => {
  const { model, record_id, action } = req.body;
  
  switch (model) {
    case 'product.barcode.unit':
      await handleBarcodeUnitChange(record_id, action);
      break;
    case 'product.pricelist.item':
      await handlePricelistItemChange(record_id, action);
      break;
  }
  
  res.status(200).json({ success: true });
});
```

## 💾 Database Schema Changes

### New Table: barcode_units

```sql
CREATE TABLE barcode_units (
  id SERIAL PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sequence INTEGER DEFAULT 10,
  product_id INTEGER NOT NULL,
  barcode VARCHAR(255) UNIQUE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  price DECIMAL(10,2) DEFAULT 0,
  av_cost DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_barcode_units_product (product_id),
  INDEX idx_barcode_units_barcode (barcode)
);
```

### Enhanced Table: pricelist_items

```sql
ALTER TABLE pricelist_items 
ADD COLUMN barcode_unit_id INTEGER,
ADD COLUMN max_quantity DECIMAL(10,2);
```

## 🛠️ Implementation Examples

### Node.js Service Class

```javascript
class BarcodeUnitService {
  async findByBarcode(barcode) {
    return await this.db.query(
      'SELECT * FROM barcode_units WHERE barcode = ? AND active = true',
      [barcode]
    );
  }
  
  async findByProduct(productId) {
    return await this.db.query(
      'SELECT * FROM barcode_units WHERE product_id = ? ORDER BY sequence',
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
}
```

## 📈 Key Benefits

1. **Multiple Packaging Units**: Each product can have different barcode units with individual pricing
2. **Advanced Pricing Rules**: Pricelist rules can target specific units with quantity limits
3. **Inventory Management**: Stock tracking works through base product (must be storable type)
4. **Flexible Pricing**: Different prices for same product in different packaging

## 🚀 Quick Start

1. **Sync barcode units** from Odoo
2. **Update product records** with barcode unit relationships  
3. **Sync enhanced pricelist items** with new fields
4. **Set up webhooks** for real-time updates
5. **Test API endpoints** for CRUD operations

This guide provides the foundation for synchronizing the new multi-units and enhanced pricelist features with your Node.js application. 