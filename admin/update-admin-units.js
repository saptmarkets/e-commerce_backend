const mongoose = require('mongoose');
const Admin = require('../backend/models/Admin');

// Connect to database - using environment variable or fallback
const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/saptmarkets';
mongoose.connect(dbUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // First check current admin access lists
    const beforeAdmins = await Admin.find({});
    console.log('Current admin access lists before update:');
    beforeAdmins.forEach(admin => {
      console.log(`${admin.name?.en || 'Unknown'} (${admin.email}, ${admin.role}): ${admin.access_list ? admin.access_list.join(', ') : 'No access list'}`);
    });
    
    // Update all admins to include 'units' in their access_list
    const result = await Admin.updateMany(
      {}, 
      { $addToSet: { access_list: 'units' } }
    );
    
    console.log(`\nUpdate result: Modified ${result.modifiedCount} of ${result.matchedCount} admin records`);
    
    // Check admin access lists after update
    const afterAdmins = await Admin.find({});
    console.log('\nAdmin access lists after update:');
    afterAdmins.forEach(admin => {
      console.log(`${admin.name?.en || 'Unknown'} (${admin.email}, ${admin.role}): ${admin.access_list ? admin.access_list.join(', ') : 'No access list'}`);
    });
    
    // Special check for Super Admin
    const superAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (superAdmin) {
      console.log('\nSuper Admin details:');
      console.log(`Name: ${superAdmin.name?.en || 'Unknown'}`);
      console.log(`Email: ${superAdmin.email}`);
      console.log(`Role: ${superAdmin.role}`);
      console.log(`Status: ${superAdmin.status || 'Not set'}`);
      console.log(`Access List: ${superAdmin.access_list ? superAdmin.access_list.join(', ') : 'No access list'}`);
      
      // If superAdmin doesn't have 'units', add it explicitly
      if (!superAdmin.access_list || !superAdmin.access_list.includes('units')) {
        superAdmin.access_list = superAdmin.access_list || [];
        superAdmin.access_list.push('units');
        await superAdmin.save();
        console.log('Added units to Super Admin access list');
      }
    } else {
      console.log('Super Admin not found!');
    }
    
    mongoose.connection.close();
    console.log('\nConnection closed');
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  }); 