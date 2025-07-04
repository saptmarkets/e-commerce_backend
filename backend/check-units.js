const mongoose = require('mongoose');
const Unit = require('./models/Unit');

async function checkUnits() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    const units = await Unit.find({}).limit(5);
    console.log('Sample units:');
    units.forEach((unit, index) => {
      console.log(`Unit ${index + 1}:`, JSON.stringify(unit, null, 2));
    });
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUnits(); 