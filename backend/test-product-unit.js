const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');

async function testProductUnit() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    // Find a ProductUnit and populate the unit
    const productUnit = await ProductUnit.findOne({})
      .populate('unit')
      .populate('product');
    
    if (productUnit) {
      console.log('ProductUnit with populated data:');
      console.log(JSON.stringify(productUnit, null, 2));
      console.log('\n--- As JSON (how frontend receives it) ---');
      console.log(JSON.stringify(productUnit.toJSON(), null, 2));
    } else {
      console.log('No ProductUnit found');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

testProductUnit(); 