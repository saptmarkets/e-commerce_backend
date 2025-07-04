const mongoose = require('mongoose');
const ProductUnit = require('./models/ProductUnit');

async function checkRecentUnits() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    // Find all ProductUnits and see their fields
    const productUnits = await ProductUnit.find({})
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('Recent ProductUnits (without population):');
    productUnits.forEach((pu, index) => {
      console.log(`\n--- ProductUnit ${index + 1} ---`);
      console.log('ID:', pu._id);
      console.log('createdAt:', pu.createdAt);
      console.log('Has unit field:', !!pu.unit);
      console.log('unit value:', pu.unit);
      console.log('Has product field:', !!pu.product);
      console.log('product value:', pu.product);
      console.log('Has old unitId field:', !!pu.unitId);
      console.log('Has old productId field:', !!pu.productId);
    });

    // Now try to populate the most recent one
    console.log('\n=== TESTING POPULATION ===');
    const recentUnit = await ProductUnit.findOne({})
      .sort({ createdAt: -1 })
      .populate('unit')
      .populate('product');
    
    if (recentUnit) {
      console.log('Most recent ProductUnit with population:');
      console.log('unit field:', recentUnit.unit);
      console.log('displayName virtual:', recentUnit.displayName);
      console.log('JSON version:', JSON.stringify(recentUnit.toJSON(), null, 2));
    }
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentUnits(); 