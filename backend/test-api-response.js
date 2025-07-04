const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');
const Unit = require('./models/Unit'); // Need to load the Unit model for population

async function testApiResponse() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('🔗 Connected to MongoDB');
    
    // Test the same logic as in the controller
    const productId = '6839d6bffbe2523a3073f970';
    
    console.log(`\n🔍 Testing ProductUnits for product: ${productId}`);
    
    const productUnits = await ProductUnit.find({
      $or: [
        { productId },
        { product: productId }
      ],
      isActive: true
    })
    .populate('unit')
    .sort({ sortOrder: 1, unitValue: 1 });

    console.log(`\n📊 Found ${productUnits.length} ProductUnits`);
    
    if (productUnits.length > 0) {
      productUnits.forEach((pu, index) => {
        console.log(`\n--- ProductUnit ${index + 1} ---`);
        console.log(`ID: ${pu._id}`);
        console.log(`Unit field type: ${typeof pu.unit}`);
        console.log(`Unit populated:`, pu.unit ? 'YES' : 'NO');
        
        if (pu.unit) {
          console.log(`Unit ID: ${pu.unit._id}`);
          console.log(`Unit name: ${pu.unit.name}`);
          console.log(`Unit shortCode: ${pu.unit.shortCode}`);
        }
        
        console.log(`DisplayName virtual: ${pu.displayName}`);
        console.log(`UnitName virtual: ${pu.unitName}`);
        
        // Test the JSON conversion
        const jsonVersion = pu.toJSON();
        console.log(`\n📄 JSON Response for this unit:`);
        console.log(`- unit field:`, typeof jsonVersion.unit, jsonVersion.unit);
        console.log(`- unitId field:`, jsonVersion.unitId);
        console.log(`- unitName field:`, jsonVersion.unitName);
        console.log(`- displayName field:`, jsonVersion.displayName);
      });
    } else {
      console.log('❌ No ProductUnits found');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testApiResponse(); 