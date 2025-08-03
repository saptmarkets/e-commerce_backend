const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create driver account
const createDriver = async () => {
  try {
    console.log('🔧 Creating driver account...');
    
    // Check if driver already exists
    const existingDriver = await Admin.findOne({ 
      email: 'driver@saptmarkets.com',
      role: 'Driver'
    });
    
    if (existingDriver) {
      console.log('✅ Driver account already exists:');
      console.log(`   Email: ${existingDriver.email}`);
      console.log(`   Name: ${existingDriver.name?.en || 'Driver'}`);
      console.log(`   Role: ${existingDriver.role}`);
      console.log(`   Status: ${existingDriver.status}`);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create driver
    const driver = new Admin({
      name: {
        en: 'Test Driver',
        ar: 'سائق تجريبي'
      },
      email: 'driver@saptmarkets.com',
      password: hashedPassword,
      phone: '+966501234567',
      role: 'Driver',
      status: 'Active',
      deliveryInfo: {
        vehicleType: 'bike',
        vehicleNumber: 'TEST-001',
        licenseNumber: 'DL-123456',
        phoneNumber: '+966501234567',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+966509876543'
        },
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        maxDeliveryRadius: 10,
        isOnDuty: false,
        availability: 'offline'
      },
      deliveryStats: {
        totalDeliveries: 0,
        completedToday: 0,
        averageRating: 5.0,
        totalRatings: 0,
        successRate: 100,
        averageDeliveryTime: 0,
        totalEarnings: 0,
        earningsToday: 0
      }
    });
    
    await driver.save();
    
    console.log('✅ Driver account created successfully!');
    console.log('📱 Login Credentials:');
    console.log(`   Email: ${driver.email}`);
    console.log(`   Password: password123`);
    console.log(`   Name: ${driver.name.en}`);
    console.log(`   Role: ${driver.role}`);
    console.log(`   Status: ${driver.status}`);
    
  } catch (error) {
    console.error('❌ Error creating driver:', error);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createDriver();
    console.log('🎉 Driver setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run the script
main(); 