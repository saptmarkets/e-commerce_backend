const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');

async function testUnitName() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    // Find the most recent ProductUnit with proper fields
    const productUnit = await ProductUnit.findOne({
      unit: { $exists: true },
      product: { $exists: true }
    })
    .sort({ createdAt: -1 })
    .populate('unit');
    
    if (productUnit) {
      console.log('Found ProductUnit with unit field');
      console.log('Unit object:', productUnit.unit);
      console.log('Unit name:', productUnit.unit ? productUnit.unit.name : 'No unit');
      console.log('displayName virtual:', productUnit.displayName);
      console.log('unitName virtual:', productUnit.unitName);
      
      console.log('\n--- JSON Response (what frontend gets) ---');
      const jsonResponse = productUnit.toJSON();
      console.log('unit in JSON:', jsonResponse.unit);
      console.log('unitId in JSON:', jsonResponse.unitId);
      console.log('unitName in JSON:', jsonResponse.unitName);
      console.log('displayName in JSON:', jsonResponse.displayName);
    } else {
      console.log('No ProductUnit found with proper unit field');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

testUnitName(); 