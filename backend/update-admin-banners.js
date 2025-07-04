const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Initialize dotenv
dotenv.config();

// Set up MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin')
  .then(async () => {
    try {
      console.log('Connected to MongoDB');
      
      // Define Admin schema
      const AdminSchema = new mongoose.Schema({
        email: String,
        role: String,
        access_list: Array,
        status: String
      });
      
      // Create Admin model
      const Admin = mongoose.model('Admin', AdminSchema);
      
      // Find super admin
      const superAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      
      if (!superAdmin) {
        console.log('Super Admin not found!');
        return;
      }
      
      // Print current access list
      console.log('Current Super Admin access list:');
      console.log(superAdmin.access_list);
      
      // Ensure banners is in the access list
      if (!superAdmin.access_list.includes('banners')) {
        superAdmin.access_list.push('banners');
        
        // Save the changes
        await superAdmin.save();
        console.log('✅ Added banners to Super Admin access list');
      } else {
        console.log('✅ Banners already in Super Admin access list');
      }
      
      // Make sure admin is active
      if (superAdmin.status !== 'Active') {
        superAdmin.status = 'Active';
        await superAdmin.save();
        console.log('Updated Super Admin status to Active');
      }
      
      // Print final access list
      const updatedAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
      console.log('\n🎯 Final Super Admin details:');
      console.log(`Email: ${updatedAdmin.email}`);
      console.log(`Role: ${updatedAdmin.role}`);
      console.log(`Status: ${updatedAdmin.status}`);
      console.log('Access List:', updatedAdmin.access_list);
      
      console.log('\n🚀 Now you can access the banners page at: http://localhost:4100/banners');
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('Connection closed');
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
  }); 