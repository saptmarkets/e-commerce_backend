const { connectDB } = require('./config/db');
const Order = require('./models/Order');
const Admin = require('./models/Admin');

async function fixDriverAssignments() {
  try {
    console.log('🔧 Fixing driver assignments...');
    await connectDB();
    console.log('Connected to database');
    
    // Get the current driver
    const currentDriver = await Admin.findOne({ email: 'driver@saptmarkets.com' });
    if (!currentDriver) {
      console.log('❌ Driver not found');
      return;
    }
    
    console.log('✅ Current driver found:', currentDriver._id.toString());
    
    // Find orders that need to be assigned to the current driver
    const unassignedOrders = await Order.find({
      status: { $in: ['Processing', 'Pending'] }
    }).limit(5).sort({ createdAt: -1 });
    
    console.log(`📦 Found ${unassignedOrders.length} orders to reassign`);
    
    // Assign orders to current driver
    for (let order of unassignedOrders) {
      console.log(`📋 Assigning order ${order.invoice} to current driver`);
      
      // Initialize deliveryInfo if it doesn't exist
      if (!order.deliveryInfo) {
        order.deliveryInfo = {};
      }
      
      // Assign to current driver
      order.deliveryInfo.assignedDriver = currentDriver._id;
      order.deliveryInfo.assignedAt = new Date();
      
      // Ensure verification code exists
      if (!order.verificationCode) {
        order.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      }
      
      await order.save();
      console.log(`✅ Order ${order.invoice} assigned successfully`);
    }
    
    console.log('\n🎉 Driver assignment fix completed!');
    console.log(`📧 Login with: driver@saptmarkets.com`);
    console.log(`🔐 Password: password123`);
    console.log(`📱 You should now see ${unassignedOrders.length} orders in the app`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixDriverAssignments(); 