require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");

const testLogin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('MongoDB connected successfully!');

    // Test admin login logic with exact credentials
    const email = 'admin@gmail.com';
    const password = '12345678';

    console.log(`\n=== TESTING ADMIN LOGIN ===`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Find admin by email
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      
      // Let's check what admin accounts exist
      const allAdmins = await Admin.find({}).select('email name status');
      console.log('\n=== EXISTING ADMIN ACCOUNTS ===');
      allAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}, Name: ${admin.name}, Status: ${admin.status}`);
      });
      return;
    }

    console.log('✅ Admin found!');
    console.log('Name:', admin.name);
    console.log('Status:', admin.status);
    console.log('Password hash exists:', !!admin.password);

    // Test password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Password is incorrect');
      
      // Let's try to create a new admin with these credentials
      console.log('\n=== CREATING NEW ADMIN ACCOUNT ===');
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = new Admin({
        email: email,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        status: 'active'
      });
      
      try {
        await newAdmin.save();
        console.log('✅ New admin account created successfully!');
        console.log('You can now login with:');
        console.log('Email: admin@gmail.com');
        console.log('Password: 12345678');
      } catch (error) {
        console.log('❌ Failed to create admin:', error.message);
      }
    }

  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testLogin(); 