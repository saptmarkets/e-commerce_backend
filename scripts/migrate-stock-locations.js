// scripts/migrate-stock-locations.js
// Usage: node scripts/migrate-stock-locations.js
// One-off migration that iterates over all products already mapped to Odoo
// and fills the new `locationStocks` array plus recalculates the `stock`
// (total available quantity) for Product and its ProductUnit documents.
//
// Safe to run multiple times – it recomputes each time.

require('dotenv').config({ path: './backend/.env' });

const mongoose = require('mongoose');
const OdooProduct = require('../backend/models/OdooProduct');
const OdooStock = require('../backend/models/OdooStock');
const Product = require('../backend/models/Product');
const ProductUnit = require('../backend/models/ProductUnit');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';

// Optional comma-separated list of location IDs (Odoo Stock location_id) to include
const BRANCH_LOCATION_IDS = (process.env.BRANCH_LOCATION_IDS || '')
  .split(',')
  .map(id => parseInt(id.trim(), 10))
  .filter(Boolean);

(async () => {
  try {
    console.log('⏳ Connecting to MongoDB…');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Querying OdooProduct mappings…');
    const odooProducts = await OdooProduct.find({ store_product_id: { $exists: true } }).lean();
    console.log(`Found ${odooProducts.length} mapped products.`);

    let updatedProducts = 0;
    let updatedUnits = 0;

    for (const op of odooProducts) {
      const storeProdId = op.store_product_id;
      if (!storeProdId) continue;

      // Aggregate stock by location
      const stockRecords = await OdooStock.find({ product_id: op.product_id, is_active: true }).lean();
      if (stockRecords.length === 0) continue;

      let locationStocks = stockRecords.map(sr => ({
        locationId: sr.location_id,
        name: sr.location_name,
        qty: sr.available_quantity ?? sr.quantity ?? 0,
      }));

      // Filter branches if env var set
      if (BRANCH_LOCATION_IDS.length) {
        locationStocks = locationStocks.filter(ls => BRANCH_LOCATION_IDS.includes(ls.locationId));
      }

      // Reduce duplicates (same location may appear multiple times)
      const aggregated = {};
      for (const ls of locationStocks) {
        if (!aggregated[ls.locationId]) {
          aggregated[ls.locationId] = { ...ls };
        } else {
          aggregated[ls.locationId].qty += ls.qty;
        }
      }
      locationStocks = Object.values(aggregated);

      const totalQty = locationStocks.reduce((acc, ls) => acc + (ls.qty || 0), 0);

      // Update Product
      await Product.findByIdAndUpdate(storeProdId, {
        stock: totalQty,
        locationStocks,
      });
      updatedProducts++;

      // Also update ALL ProductUnits belonging to this product
      const unitRes = await ProductUnit.updateMany({ product: storeProdId }, {
        stock: totalQty,
        locationStocks,
      });
      updatedUnits += unitRes.modifiedCount;
    }

    console.log(`✅ Migration complete. Updated ${updatedProducts} products and ${updatedUnits} product-units.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})(); 