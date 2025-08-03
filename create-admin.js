require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('MongoDB connected successfully!');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists with email: admin@gmail.com');
      console.log('Name:', existingAdmin.name);
      console.log('Status:', existingAdmin.status);
      return;
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const newAdmin = new Admin({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    await newAdmin.save();
    console.log('✅ New admin created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

createAdmin(); 