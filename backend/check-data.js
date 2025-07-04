const mongoose = require('mongoose');
const Product = require('./models/Product');
const Unit = require('./models/Unit');

async function checkData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check existing units
    console.log('\n📋 EXISTING UNITS:');
    const units = await Unit.find({}).select('name shortCode type basicType isParent parentUnit packValue');
    console.log(`Found ${units.length} units:`);
    units.forEach(unit => {
      console.log(`- ${unit.name} (${unit.shortCode}) - Type: ${unit.type || 'N/A'}, BasicType: ${unit.basicType || 'N/A'}, IsParent: ${unit.isParent || false}`);
    });
    
    // Check a few sample products
    console.log('\n📦 SAMPLE PRODUCTS:');
    const products = await Product.find({}).limit(5).select('title basicUnitType basicUnit');
    console.log(`Showing 5 sample products out of total:`);
    products.forEach(product => {
      console.log(`- ${product.title} - BasicUnitType: ${product.basicUnitType || 'N/A'}, BasicUnit: ${product.basicUnit || 'N/A'}`);
    });
    
    // Check what basicUnitTypes are used
    console.log('\n🔍 BASIC UNIT TYPES IN PRODUCTS:');
    const basicUnitTypes = await Product.distinct('basicUnitType');
    console.log('Unique basicUnitTypes found:', basicUnitTypes);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData(); 