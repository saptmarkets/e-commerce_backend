const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');
const Unit = require('./models/Unit');

async function debugSpecificUnit() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('🔗 Connected to MongoDB');
    
    // The product ID from the console logs
    const productId = '6839d6bffbe2523a3073f970';
    
    console.log(`\n🔍 Debugging ProductUnits for product: ${productId}`);
    
    // Find all ProductUnits for this product (both formats)
    const allUnits = await ProductUnit.find({
      $or: [
        { productId },
        { product: productId }
      ]
    }).sort({ createdAt: -1 });

    console.log(`\n📊 Found ${allUnits.length} total ProductUnits (all)`);
    
    allUnits.forEach((pu, index) => {
      console.log(`\n--- ProductUnit ${index + 1} (${pu.isActive ? 'ACTIVE' : 'INACTIVE'}) ---`);
      console.log(`ID: ${pu._id}`);
      console.log(`Created: ${pu.createdAt}`);
      console.log(`Unit field (ObjectId):`, pu.unit);
      console.log(`Product field (ObjectId):`, pu.product);
      console.log(`Old productId field:`, pu.productId);
      console.log(`Old unitId field:`, pu.unitId);
      console.log(`Is Active:`, pu.isActive);
    });

    // Now find only active ones and populate
    console.log(`\n🔍 Fetching ACTIVE ProductUnits with population...`);
    
    const activeUnits = await ProductUnit.find({
      $or: [
        { productId },
        { product: productId }
      ],
      isActive: true
    })
    .populate('unit')
    .sort({ sortOrder: 1, unitValue: 1 });

    console.log(`\n📊 Found ${activeUnits.length} ACTIVE ProductUnits`);
    
    if (activeUnits.length > 0) {
      activeUnits.forEach((pu, index) => {
        console.log(`\n--- ACTIVE ProductUnit ${index + 1} ---`);
        console.log(`ID: ${pu._id}`);
        console.log(`Unit populated:`, pu.unit ? 'YES' : 'NO');
        
        if (pu.unit) {
          console.log(`Unit details:`, {
            id: pu.unit._id,
            name: pu.unit.name,
            shortCode: pu.unit.shortCode,
            type: pu.unit.type
          });
        } else {
          console.log(`Unit field value:`, pu.unit);
        }
        
        console.log(`Virtual fields:`, {
          displayName: pu.displayName,
          unitName: pu.unitName
        });
        
        // Test the API response format
        const jsonResponse = pu.toJSON();
        console.log(`\n📄 JSON Response unit field:`, jsonResponse.unit);
        console.log(`📄 JSON Response unitId field:`, jsonResponse.unitId);
        console.log(`📄 JSON Response unitName field:`, jsonResponse.unitName);
        console.log(`📄 JSON Response displayName field:`, jsonResponse.displayName);
      });
    } else {
      console.log('❌ No ACTIVE ProductUnits found');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSpecificUnit(); 