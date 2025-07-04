const mongoose = require('mongoose');
const Product = require('./models/Product');
const Unit = require('./models/Unit');
const ProductUnit = require('./models/ProductUnit');

async function verifyMigration() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('\n🔍 MIGRATION VERIFICATION REPORT');
    console.log('=====================================');
    
    // Check Units
    const totalUnits = await Unit.countDocuments();
    const parentUnits = await Unit.countDocuments({ isParent: true });
    const childUnits = await Unit.countDocuments({ isParent: false });
    
    console.log('\n📏 UNITS SUMMARY:');
    console.log(`- Total Units: ${totalUnits}`);
    console.log(`- Parent/Basic Units: ${parentUnits}`);
    console.log(`- Child Units: ${childUnits}`);
    
    // List all parent units
    const basicUnits = await Unit.find({ isParent: true }).select('name shortCode type');
    console.log('\n🏷️  Basic Units Available:');
    basicUnits.forEach(unit => {
      console.log(`  - ${unit.name} (${unit.shortCode}) - ${unit.type}`);
    });
    
    // Check Products
    const totalProducts = await Product.countDocuments();
    const productsWithBasicUnit = await Product.countDocuments({ 
      basicUnit: { $exists: true, $ne: null } 
    });
    const productsWithoutBasicUnit = await Product.countDocuments({
      $or: [
        { basicUnit: { $exists: false } },
        { basicUnit: null }
      ]
    });
    
    console.log('\n📦 PRODUCTS SUMMARY:');
    console.log(`- Total Products: ${totalProducts}`);
    console.log(`- Products with Basic Unit: ${productsWithBasicUnit}`);
    console.log(`- Products without Basic Unit: ${productsWithoutBasicUnit}`);
    
    // Check ProductUnits
    const totalProductUnits = await ProductUnit.countDocuments();
    const defaultProductUnits = await ProductUnit.countDocuments({ isDefault: true });
    
    console.log('\n🏷️  PRODUCT UNITS SUMMARY:');
    console.log(`- Total ProductUnits: ${totalProductUnits}`);
    console.log(`- Default ProductUnits: ${defaultProductUnits}`);
    
    // Show sample products with their units
    console.log('\n📋 SAMPLE PRODUCTS (First 5):');
    const sampleProducts = await Product.find({ basicUnit: { $exists: true } })
      .populate('basicUnit', 'name shortCode')
      .limit(5)
      .select('title price basicUnit basicUnitType');
      
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title}`);
      console.log(`     - Price: $${product.price || 0}`);
      console.log(`     - Basic Unit: ${product.basicUnit?.name} (${product.basicUnit?.shortCode})`);
      console.log(`     - Basic Unit Type: ${product.basicUnitType}`);
    });
    
    // Show sample ProductUnits
    console.log('\n🔗 SAMPLE PRODUCT UNITS (First 5):');
    const sampleProductUnits = await ProductUnit.find()
      .populate('productId', 'title')
      .populate('unitId', 'name shortCode')
      .limit(5)
      .select('productId unitId unitValue price isDefault isActive');
      
    sampleProductUnits.forEach((pu, index) => {
      console.log(`  ${index + 1}. ${pu.productId?.title || 'Unknown Product'}`);
      console.log(`     - Unit: ${pu.unitId?.name} (${pu.unitId?.shortCode})`);
      console.log(`     - Value: ${pu.unitValue}`);
      console.log(`     - Price: $${pu.price}`);
      console.log(`     - Default: ${pu.isDefault ? 'Yes' : 'No'}`);
      console.log(`     - Active: ${pu.isActive ? 'Yes' : 'No'}`);
    });
    
    // Hierarchical structure verification
    console.log('\n🌳 HIERARCHICAL UNIT STRUCTURE:');
    for (const parentUnit of basicUnits) {
      const childUnits = await Unit.find({ parentUnit: parentUnit._id }).select('name shortCode packValue');
      console.log(`\n  📁 ${parentUnit.name} (${parentUnit.shortCode})`);
      if (childUnits.length > 0) {
        childUnits.forEach(child => {
          console.log(`    └── ${child.name} (${child.shortCode}) - Pack Value: ${child.packValue}`);
        });
      } else {
        console.log(`    └── No child units`);
      }
    }
    
    // Migration status
    console.log('\n✅ MIGRATION STATUS:');
    if (productsWithoutBasicUnit === 0 && totalProductUnits > 0) {
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ All products have basic units assigned');
      console.log('✅ ProductUnit entries created');
      console.log('✅ Hierarchical unit structure is in place');
    } else {
      console.log('⚠️  MIGRATION INCOMPLETE:');
      if (productsWithoutBasicUnit > 0) {
        console.log(`❌ ${productsWithoutBasicUnit} products still need basic units`);
      }
      if (totalProductUnits === 0) {
        console.log('❌ No ProductUnit entries found');
      }
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Start your frontend admin: npm start (in admin directory)');
    console.log('3. Test the new hierarchical unit system in the admin panel');
    console.log('4. Create/edit products to test the new ProductUnitsManager');
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyMigration(); 