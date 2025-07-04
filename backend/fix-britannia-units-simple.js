/**
 * Simple fix for Britannia product - recreate missing ProductUnits
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Fix Britannia product
const fixBritanniaUnits = async () => {
  console.log('\n🔧 Fixing Britannia Product Units...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const Unit = require('./models/Unit');

    // 1. Find the Britannia product
    const storeProduct = await Product.findOne({ sku: 'CONS_0351' });
    console.log(`1️⃣ Found Britannia product: ${storeProduct._id}`);

    // 2. Find the OdooProduct and barcode unit
    const odooProduct = await OdooProduct.findOne({ product_id: 4829 });
    const barcodeUnit = await OdooBarcodeUnit.findOne({ id: 7383 });
    
    console.log(`2️⃣ Found OdooBarcodeUnit: ${barcodeUnit.name} (${barcodeUnit.barcode})`);

    // 3. Find or create the base unit (pcs)
    let baseUnit = await Unit.findOne({ shortCode: 'pcs' });
    if (!baseUnit) {
      baseUnit = await Unit.create({
        name: 'Pieces',
        shortCode: 'pcs',
        type: 'base',
        isBase: true
      });
    }

    // 4. Find or create the CTN unit
    let ctnUnit = await Unit.findOne({ shortCode: 'ctn12' });
    if (!ctnUnit) {
      ctnUnit = await Unit.create({
        name: 'CTN 12',
        shortCode: 'ctn12',
        type: 'pack',
        isBase: false
      });
    }

    console.log(`3️⃣ Units ready: Base (${baseUnit._id}), CTN (${ctnUnit._id})`);

    // 5. Create the base ProductUnit (default unit)
    let baseProductUnit = await ProductUnit.findOne({ 
      product: storeProduct._id,
      isDefault: true 
    });

    if (!baseProductUnit) {
      baseProductUnit = await ProductUnit.create({
        product: storeProduct._id,
        unit: baseUnit._id,
        unitType: 'base',
        unitValue: 1,
        packQty: 1,
        price: storeProduct.price || 0,
        sku: storeProduct.sku,
        barcode: storeProduct.barcode,
        name: 'Base Unit',
        isDefault: true,
        isActive: true,
        isAvailable: true,
        stock: storeProduct.stock || 0,
        locationStocks: storeProduct.locationStocks || []
      });
      console.log(`✅ Created base ProductUnit: ${baseProductUnit._id}`);
    } else {
      console.log(`✅ Base ProductUnit exists: ${baseProductUnit._id}`);
    }

    // 6. Create the CTN ProductUnit
    let ctnProductUnit = await ProductUnit.findOne({ 
      product: storeProduct._id,
      barcode: barcodeUnit.barcode 
    });

    if (!ctnProductUnit) {
      ctnProductUnit = await ProductUnit.create({
        product: storeProduct._id,
        unit: ctnUnit._id,
        unitType: 'multi',
        unitValue: 1,
        packQty: barcodeUnit.quantity || 12,
        price: barcodeUnit.price || storeProduct.price || 0,
        sku: `${storeProduct.sku}-CTN12`,
        barcode: barcodeUnit.barcode,
        name: 'CTN 12',
        isDefault: false,
        isActive: true,
        isAvailable: true,
        stock: storeProduct.stock || 0,
        locationStocks: storeProduct.locationStocks || []
      });
      console.log(`✅ Created CTN ProductUnit: ${ctnProductUnit._id}`);
    } else {
      console.log(`✅ CTN ProductUnit exists: ${ctnProductUnit._id}`);
    }

    // 7. Update the store product's availableUnits
    await Product.findByIdAndUpdate(storeProduct._id, {
      availableUnits: [baseProductUnit._id, ctnProductUnit._id],
      hasMultiUnits: true,
      basicUnit: baseProductUnit._id
    });

    console.log(`4️⃣ Updated store product availableUnits`);

    // 8. Update the barcode unit mapping
    await OdooBarcodeUnit.updateOne(
      { id: barcodeUnit.id },
      { 
        store_product_unit_id: ctnProductUnit._id,
        _sync_status: 'imported'
      }
    );

    console.log(`5️⃣ Updated barcode unit mapping`);

    // 9. Verify the results
    console.log('\n6️⃣ Verification:');
    
    const updatedProduct = await Product.findById(storeProduct._id);
    console.log(`   Store product availableUnits: ${updatedProduct.availableUnits.length}`);
    
    for (const unitId of updatedProduct.availableUnits) {
      const unit = await ProductUnit.findById(unitId);
      console.log(`   ✅ Unit ${unit._id}: ${unit.name} (${unit.barcode}) - ${unit.isDefault ? 'DEFAULT' : 'MULTI'}`);
    }

    const updatedBarcodeUnit = await OdooBarcodeUnit.findOne({ id: 7383 });
    console.log(`   Barcode unit mapping: ${updatedBarcodeUnit.store_product_unit_id}`);

    console.log('\n🎉 Britannia units fixed successfully!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixBritanniaUnits();
  
  console.log('\n🎉 Fix completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 