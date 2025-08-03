require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const Customer = require("./models/Customer");

const checkAccounts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('MongoDB connected successfully!');

    // Check Admin accounts
    console.log('\n=== ADMIN ACCOUNTS ===');
    const admins = await Admin.find({}).select('email name role status');
    console.log(`Total admins: ${admins.length}`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}, Name: ${admin.name}, Role: ${admin.role}, Status: ${admin.status}`);
    });

    // Check Customer accounts
    console.log('\n=== CUSTOMER ACCOUNTS ===');
    const customers = await Customer.find({}).select('email name status');
    console.log(`Total customers: ${customers.length}`);
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. Email: ${customer.email}, Name: ${customer.name}, Status: ${customer.status}`);
    });

    // Check for specific accounts
    console.log('\n=== SEARCHING FOR SPECIFIC ACCOUNTS ===');
    
    const adminAccount = await Admin.findOne({ email: 'admin@gmail.com' });
    if (adminAccount) {
      console.log('✅ Admin account found: admin@gmail.com');
    } else {
      console.log('❌ Admin account not found: admin@gmail.com');
    }

    const customerAccount = await Customer.findOne({ email: 'asadji.bkt@gmail.com' });
    if (customerAccount) {
      console.log('✅ Customer account found: asadji.bkt@gmail.com');
    } else {
      console.log('❌ Customer account not found: asadji.bkt@gmail.com');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkAccounts(); 