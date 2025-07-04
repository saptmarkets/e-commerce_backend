const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const Admin = require('./models/Admin');

async function addDriver() {
  try {
    console.log('🚀 Adding delivery driver...');
    await connectDB();
    
    const existing = await Admin.findOne({ email: 'driver@saptmarkets.com' });
    if (existing) {
      console.log('✅ Driver already exists');
      process.exit(0);
    }
    
    const driver = new Admin({
      name: { en: 'Delivery Driver' },
      email: 'driver@saptmarkets.com',
      password: await bcrypt.hash('password123', 10),
      phone: '555-0123',
      role: 'Driver',
      status: 'Active',
      joiningData: new Date()
    });
    
    await driver.save();
    console.log('✅ Delivery driver added successfully!');
    console.log('📧 Email: driver@saptmarkets.com');
    console.log('🔐 Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDriver(); 