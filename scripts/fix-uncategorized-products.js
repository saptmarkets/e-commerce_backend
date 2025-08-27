require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

const Product = require('../models/Product');
const Category = require('../models/Category');
const OdooProduct = require('../models/OdooProduct');
const OdooCategory = require('../models/OdooCategory');
const odooImportService = require('../services/odooImportService');

async function main() {
  console.log('🔧 Fix Uncategorized Products - Start');

  try {
    await connectDB();
    console.log('✅ Connected to database');

    // 1) Identify unknown/placeholder categories
    const unknownCats = await Category.find({
      $or: [
        { slug: /unknown/i },
        { 'name.en': /unknown/i },
        { 'name.ar': /غير معروف/i },
        { 'name.en': /uncategor/i },
        { 'name.ar': /غير مصنف/i },
      ]
    }, { _id: 1, name: 1, slug: 1 }).lean();

    const unknownCatIds = new Set(unknownCats.map(c => String(c._id)));
    console.log(`📂 Found ${unknownCats.length} unknown/placeholder categories`);

    // 2) Query products with missing/null/unknown category
    const matchQuery = {
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: { $in: Array.from(unknownCatIds) } },
      ]
    };

    const totalToProcess = await Product.countDocuments(matchQuery);
    console.log(`📦 Products needing category fix: ${totalToProcess}`);

    const batchSize = parseInt(process.env.FIX_UNCATEGORIZED_BATCH_SIZE || '200', 10);
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Cursor approach to stream through large sets
    const cursor = Product.find(matchQuery, { _id: 1, sku: 1, barcode: 1, odooProductId: 1 }).lean().cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      processed++;
      const productId = doc._id;
      const sku = doc.sku && String(doc.sku).trim();
      const barcode = doc.barcode && String(doc.barcode).trim();
      const odooProductId = typeof doc.odooProductId === 'number' ? doc.odooProductId : (doc.odooProductId ? Number(doc.odooProductId) : null);

      try {
        // Resolve Odoo product mapping - preference order:
        // 1) Product.odooProductId -> OdooProduct.id
        // 2) OdooProduct.store_product_id -> productId
        // 3) Fallback via barcode/sku
        let odooProd = null;

        if (odooProductId) {
          odooProd = await OdooProduct.findOne({ id: odooProductId }).lean();
        }

        if (!odooProd) {
          odooProd = await OdooProduct.findOne({ store_product_id: productId }).lean();
        }

        if (!odooProd) {
          const orClauses = [];
          if (barcode) orClauses.push({ barcode });
          if (sku) orClauses.push({ default_code: sku });
          if (orClauses.length > 0) {
            odooProd = await OdooProduct.findOne({ $or: orClauses }).lean();

            // If we found via fallback, persist mapping for future
            if (odooProd && !odooProd.store_product_id) {
              try {
                await OdooProduct.updateOne({ _id: odooProd._id }, { $set: { store_product_id: productId } });
              } catch (mapSaveErr) {
                console.warn('⚠️ Failed to persist store_product_id mapping on OdooProduct', mapSaveErr.message);
              }
            }
          }
        }

        if (!odooProd || !odooProd.categ_id) {
          skipped++;
          if (processed % 50 === 0) console.log(`⏭️  Skipped (no Odoo match/category): ${processed}/${totalToProcess}`);
          continue;
        }

        // Ensure Odoo category exists/mapped to store
        let odooCat = await OdooCategory.findOne({ id: odooProd.categ_id }).lean();
        if (!odooCat) {
          // Category not in odoo_categories cache - nothing we can do without refetch
          skipped++;
          if (processed % 50 === 0) console.log(`⏭️  Skipped (OdooCategory not found: ${odooProd.categ_id}): ${processed}/${totalToProcess}`);
          continue;
        }

        if (!odooCat.store_category_id) {
          try {
            // Import just this category to build path and mapping
            await odooImportService.importCategories([odooCat.id]);
            // Re-read mapping
            odooCat = await OdooCategory.findOne({ id: odooProd.categ_id }).lean();
          } catch (impErr) {
            console.warn(`⚠️ ImportCategories failed for Odoo category ${odooCat.id}: ${impErr.message}`);
          }
        }

        if (!odooCat.store_category_id) {
          skipped++;
          if (processed % 50 === 0) console.log(`⏭️  Skipped (no store_category_id mapping yet): ${processed}/${totalToProcess}`);
          continue;
        }

        // Update product category/categories
        const res = await Product.updateOne(
          { _id: productId },
          { $set: { category: odooCat.store_category_id, categories: [odooCat.store_category_id] } }
        );
        if (res.modifiedCount > 0) {
          updated++;
        } else {
          skipped++;
        }

        if (processed % 50 === 0) {
          console.log(`📈 Progress: ${processed}/${totalToProcess} processed | ${updated} updated | ${skipped} skipped | ${errors} errors`);
        }
      } catch (e) {
        errors++;
        console.error(`❌ Error processing product ${productId}:`, e.message);
      }
    }

    console.log('✅ Fix Uncategorized Products - Completed');
    console.log(`Summary: processed=${processed}, updated=${updated}, skipped=${skipped}, errors=${errors}`);
  } catch (err) {
    console.error('🚨 Fatal error:', err);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 DB connection closed');
    } catch (e) {}
    process.exit(0);
  }
}

main(); 