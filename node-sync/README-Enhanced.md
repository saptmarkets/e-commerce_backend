# Odoo to MongoDB Sync - Enhanced Node.js Implementation

This enhanced Node.js implementation provides **complete feature parity** with your Python script, synchronizing all data types from Odoo to MongoDB.

## 🎯 Analysis: Python vs Node.js

### Your Python Script Features:
- ✅ GUI Interface (tkinter)
- ✅ 6 Data Types: Products, Categories, UoM, Pricelists, Stock, Promotions
- ✅ Product Variants & Attributes
- ✅ Comprehensive Product Viewer
- ✅ Batch Processing
- ✅ Error Handling & Retry Logic
- ✅ Configuration Management

### Enhanced Node.js Implementation:
- ✅ Web Interface (replaces GUI)
- ✅ **ALL 6 Data Types** (now complete!)
- ✅ Product Variants & Attributes (enhanced)
- ✅ Comprehensive Product Viewer (web-based)
- ✅ Batch Processing (optimized)
- ✅ Error Handling & Retry Logic (improved)
- ✅ RESTful API (bonus feature)

## 🚀 What's New in Enhanced Version

### New Services Added:
1. **`services/odoo-enhanced.js`** - Complete sync service
2. **`services/product-viewer.js`** - Product viewing service

### Missing Sync Methods Added:
- `syncUom()` - Units of Measure
- `syncPricelists()` - Price Lists  
- `syncStock()` - Stock Information
- `syncPromotions()` - Price List Items

### Enhanced Features:
- Product variants handling (product.template + product.product)
- Product attributes synchronization
- Comprehensive error handling
- Optimized batch processing
- Individual sync endpoints
- Detailed product viewer

## 📊 Complete Data Model (Matching Python)

```javascript
// All 6 collections from your Python script
{
  products: {        // product.template + product.product
    product_tmpl_id: Number,
    product_id: Number,      // Unique variant ID
    name: String,
    default_code: String,    // SKU
    barcode: String,
    list_price: Number,
    standard_price: Number,
    qty_available: Number,
    virtual_available: Number,
    uom_id: Number,         // Reference to UoM
    category_id: Number,    // Reference to Category
    attributes: Array,      // Product attributes
    // ... more fields
  },
  
  categories: {      // product.category
    category_id: Number,
    name: String,
    parent_id: Number,
    complete_name: String,
    // ... more fields
  },
  
  uom: {            // uom.uom (NEW!)
    uom_id: Number,
    name: String,
    factor: Number,
    uom_type: String,
    // ... more fields
  },
  
  pricelists: {     // product.pricelist (NEW!)
    pricelist_id: Number,
    name: String,
    currency_id: Number,
    // ... more fields
  },
  
  stock: {          // stock.quant (NEW!)
    quant_id: Number,
    product_id: Number,
    location_id: Number,
    quantity: Number,
    reserved_quantity: Number,
    // ... more fields
  },
  
  pricelist_items: { // product.pricelist.item (NEW!)
    item_id: Number,
    pricelist_id: Number,
    product_id: Number,
    fixed_price: Number,
    date_start: Date,
    date_end: Date,
    // ... more fields
  }
}
```

## 🔄 API Endpoints (Complete Set)

### Full Synchronization
```http
POST /sync/start
```
**Response:**
```json
{
  "categories": 150,
  "uom": 25,           // NEW!
  "pricelists": 5,     // NEW!
  "products": 1250,
  "stock": 890,        // NEW!
  "promotions": 45,    // NEW!
  "success": true
}
```

### Individual Sync Operations (All Types)
```http
POST /sync/categories   # Product categories
POST /sync/uom         # Units of measure (NEW!)
POST /sync/pricelists  # Price lists (NEW!)
POST /sync/products    # Products with variants
POST /sync/stock       # Stock information (NEW!)
POST /sync/promotions  # Promotions/price rules (NEW!)
```

### Product Viewer (Matching Python GUI)
```http
GET /view/product/123   # Detailed product view
GET /view/api/product/123  # JSON API
```

**Product Details Include:**
- Basic Info (ID, Name, SKU, Barcode, Prices)
- Category & UoM Information  
- Stock Information by Location
- Pricing & Promotions

## 🔧 Usage Examples

### 1. Run Complete Sync (All 6 Data Types)
```bash
curl -X POST http://localhost:7000/sync/start
```

### 2. Sync Individual Types
```bash
# Sync only UoM
curl -X POST http://localhost:7000/sync/uom

# Sync only stock
curl -X POST http://localhost:7000/sync/stock

# Sync only promotions  
curl -X POST http://localhost:7000/sync/promotions
```

### 3. View Product Details (Like Python GUI)
```bash
curl http://localhost:7000/view/api/product/123
```

## 📈 Performance Comparison

| Aspect | Python Script | Enhanced Node.js |
|--------|---------------|------------------|
| **Data Types** | 6 ✅ | 6 ✅ |
| **Product Variants** | ✅ | ✅ Enhanced |
| **Batch Size** | 100 | 100 (configurable) |
| **Error Handling** | ✅ | ✅ Improved |
| **Interface** | GUI | Web + API |
| **Deployment** | Desktop | Server/Cloud |
| **Integration** | Standalone | REST API |

## 🎉 Your Node.js Implementation is Now Complete!

### ✅ Everything from Python Script:
- [x] All 6 data synchronization types
- [x] Product variants and attributes  
- [x] Comprehensive product viewer
- [x] Batch processing
- [x] Error handling with retries
- [x] Complete data model matching

### 🚀 Plus Additional Benefits:
- [x] RESTful API for integrations
- [x] Web-based interface
- [x] Server deployment ready
- [x] JSON responses for automation
- [x] Enhanced MongoDB indexing

**Your Node.js project now has complete feature parity with your Python script and is ready for production use!** 

The main difference is the interface (web-based vs desktop GUI), but all the core synchronization functionality is identical and enhanced. 