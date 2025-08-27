try { require('dotenv').config(); } catch (_) {}

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const OdooProduct = require('../models/OdooProduct');
const OdooCategory = require('../models/OdooCategory');

function getArg(name) {
  const pfx = `--${name}=`;
  const a = (process.argv || []).find(s => typeof s === 'string' && s.startsWith(pfx));
  return a ? a.slice(pfx.length) : null;
}

(async function run() {
  try {
    const uriArg = getArg('uri');
    if (uriArg && !process.env.MONGO_URI && !process.env.MONGODB_URI) process.env.MONGO_URI = uriArg;

    await connectDB();

    const id = getArg('id');
    const sku = getArg('sku');
    const barcode = getArg('barcode');

    if (!id && !sku && !barcode) {
      console.log('Usage: node scripts/debug-product-category.js --uri=<mongo_uri> [--id=<ObjectId>] [--sku=<sku>] [--barcode=<barcode>]');
      process.exit(1);
    }

    const prodQuery = id ? { _id: id } : (sku ? { sku } : { barcode });
    const prod = await Product.findOne(prodQuery).lean();
    if (!prod) {
      console.log('Product not found for query:', prodQuery);
      process.exit(0);
    }

    console.log('Store Product:', {
      _id: prod._id,
      title: prod.title,
      sku: prod.sku,
      barcode: prod.barcode,
      odooProductId: prod.odooProductId,
      category: prod.category,
      categories: prod.categories,
    });

    let storeCat = null;
    if (prod.category) storeCat = await Category.findById(prod.category).lean();
    console.log('Store Category (current):', storeCat ? { _id: storeCat._id, name: storeCat.name, slug: storeCat.slug } : null);

    // Resolve OdooProduct by preference: product.odooProductId -> store_product_id -> fallback sku/barcode
    let op = null;
    if (typeof prod.odooProductId === 'number') op = await OdooProduct.findOne({ id: prod.odooProductId }).lean();
    if (!op) op = await OdooProduct.findOne({ store_product_id: prod._id }).lean();
    if (!op && prod.barcode) op = await OdooProduct.findOne({ barcode: prod.barcode }).lean();
    if (!op && prod.sku) op = await OdooProduct.findOne({ default_code: prod.sku }).lean();

    console.log('OdooProduct match:', op ? { id: op.id, default_code: op.default_code, barcode: op.barcode, categ_id: op.categ_id, store_product_id: op.store_product_id } : null);

    let oc = null;
    if (op && op.categ_id) oc = await OdooCategory.findOne({ id: op.categ_id }).lean();
    console.log('OdooCategory:', oc ? { id: oc.id, name: oc.name, complete_name: oc.complete_name, store_category_id: oc.store_category_id } : null);

    let mappedStoreCat = null;
    if (oc && oc.store_category_id) mappedStoreCat = await Category.findById(oc.store_category_id).lean();
    console.log('Mapped Store Category:', mappedStoreCat ? { _id: mappedStoreCat._id, name: mappedStoreCat.name, slug: mappedStoreCat.slug } : null);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(0);
  }
})(); 