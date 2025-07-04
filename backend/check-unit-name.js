const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');
const Unit = require('./models/Unit');

async function checkUnitName() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('🔗 Connected to MongoDB');
    
    const productId = '6839d6bffbe2523a3073f970';
    
    const productUnit = await ProductUnit.findOne({
      $or: [
        { productId },
        { product: productId }
      ],
      isActive: true
    }).populate('unit');

    if (productUnit) {
      console.log('\n=== UNIT OBJECT ANALYSIS ===');
      console.log('Direct unit object:', productUnit.unit);
      console.log('Unit name via dot notation:', productUnit.unit.name);
      console.log('Unit has name property:', 'name' in productUnit.unit);
      console.log('Unit name via bracket notation:', productUnit.unit['name']);
      
      console.log('\n=== JSON CONVERSION ANALYSIS ===');
      const jsonResponse = productUnit.toJSON();
      console.log('JSON unit object:', jsonResponse.unit);
      console.log('JSON unit.name:', jsonResponse.unit.name);
      console.log('JSON unit has name property:', 'name' in jsonResponse.unit);
      
      console.log('\n=== FULL JSON STRUCTURE ===');
      console.log(JSON.stringify(jsonResponse.unit, null, 2));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUnitName(); 