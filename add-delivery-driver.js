const bcrypt = require('bcryptjs');
const { connectDB } = require('./backend/config/db');
const Admin = require('./backend/models/Admin');

const addDeliveryDriver = async () => {
  try {
    console.log('🚀 Adding delivery driver to database...');
    
    await connectDB();
    
    // Check if driver already exists
    const existingDriver = await Admin.findOne({ email: 'driver@saptmarkets.com' });
    if (existingDriver) {
      console.log('✅ Delivery driver already exists');
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create delivery driver
    const deliveryDriver = new Admin({
      name: { en: 'Delivery Driver' },
      email: 'driver@saptmarkets.com',
      password: hashedPassword,
      phone: '555-0123',
      role: 'Driver',
      status: 'Active',
      joiningData: new Date(),
      image: 'https://i.ibb.co/2qgXcqP/team-1.jpg',
      access_list: []
    });
    
    await deliveryDriver.save();
    
    console.log('✅ Delivery driver added successfully!');
    console.log('📧 Email: driver@saptmarkets.com');
    console.log('🔐 Password: password123');
    console.log('👤 Role: Driver');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding delivery driver:', error);
    process.exit(1);
  }
};

addDeliveryDriver(); 