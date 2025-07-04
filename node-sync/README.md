# Odoo to MongoDB Sync - Node.js Enhanced

A comprehensive Node.js implementation that synchronizes e-commerce data from Odoo ERP to MongoDB, matching the functionality of the Python script.

## 🚀 Enhanced Features

### Complete Data Synchronization
- ✅ **Products** (product.template & product.product with variants)
- ✅ **Categories** (product.category) 
- ✅ **Units of Measure** (uom.uom)
- ✅ **Price Lists** (product.pricelist)
- ✅ **Stock Information** (stock.quant)
- ✅ **Promotions** (product.pricelist.item)

### Key Improvements
- 🌐 **Web Interface** (replacing GUI)
- 🔧 **RESTful API** endpoints
- 📊 **Product Viewer** with detailed information
- ⚡ **Batch Processing** for performance
- 🛡️ **Error Handling** with retry logic
- 🗂️ **MongoDB Indexing** for optimization

## 🏗️ Project Structure

```
├── services/
│   ├── odoo-enhanced.js     # Complete sync service
│   └── product-viewer.js    # Product viewing service
├── routes/
│   ├── sync.js             # Sync API endpoints
│   └── view.js             # Data viewing routes
├── models/index.js         # MongoDB collections
└── server.js              # Main application
```

## 📡 API Endpoints

### Sync Operations
```http
POST /sync/start        # Full sync (all data types)
POST /sync/categories   # Sync categories only
POST /sync/uom         # Sync units of measure
POST /sync/pricelists  # Sync price lists
POST /sync/products    # Sync products with variants
POST /sync/stock       # Sync stock information
POST /sync/promotions  # Sync promotions
GET  /sync/status      # Check connection
GET  /sync/progress    # Get sync status
```

### Data Viewing
```http
GET /view/products     # Products list
GET /view/categories   # Categories
GET /view/uom         # Units of measure
GET /view/pricelists  # Price lists
GET /view/stock       # Stock information
GET /view/promotions  # Promotions
GET /view/product/:id # Product details
```

## 🔄 Enhanced vs Original

| Feature | Original | Enhanced |
|---------|----------|----------|
| Data Types | 2 (Categories, Products) | 6 (All types) |
| Product Variants | ❌ | ✅ |
| Product Attributes | ❌ | ✅ |
| UoM Sync | ❌ | ✅ |
| Stock Sync | ❌ | ✅ |
| Promotions | ❌ | ✅ |
| Error Handling | Basic | Comprehensive |
| Batch Processing | Basic | Optimized |

## 🚦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```env
   ODOO_HOST=localhost
   ODOO_PORT=8069
   ODOO_DB=forapi_17
   ODOO_USERNAME=admin
   ODOO_PASSWORD=admin
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Run synchronization**:
   ```bash
   curl -X POST http://localhost:7000/sync/start
   ```

## 📊 Data Models

The enhanced implementation includes comprehensive MongoDB collections with proper indexing:

- **Products**: Complete product data with variants and attributes
- **Categories**: Hierarchical category structure
- **UoM**: Units of measure with conversion factors
- **Pricelists**: Price list definitions
- **Stock**: Real-time stock quantities by location
- **Promotions**: Price rules and promotional pricing

## 🎯 Python Script Equivalence

Your Node.js implementation now provides equivalent functionality to your Python script:

- ✅ All 6 data types synchronized
- ✅ Product variants and attributes handled
- ✅ Comprehensive error handling
- ✅ Batch processing for performance
- ✅ Detailed product viewer (web-based instead of GUI)
- ✅ Individual and bulk sync operations
- ✅ MongoDB optimization with proper indexing

The main difference is the interface: web-based instead of desktop GUI, making it suitable for server deployments and API integrations.

---

Your Node.js project is now feature-complete and matches your Python script's comprehensive functionality! 🎉 