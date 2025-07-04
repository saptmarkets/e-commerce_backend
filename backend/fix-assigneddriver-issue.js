const mongoose = require('mongoose');
const Order = require('./models/Order');

async function fixAssignedDriverIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔧 Fixing assignedDriver empty string issue...\n');
    
    // Use raw MongoDB operations to fix empty string assignedDriver
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');
    
    // Find orders with empty string assignedDriver
    const ordersWithEmptyDriver = await ordersCollection.find({
      'deliveryInfo.assignedDriver': ''
    }).toArray();
    
    console.log(`📋 Found ${ordersWithEmptyDriver.length} orders with empty assignedDriver`);
    
    // Fix all orders with empty assignedDriver in one operation
    const updateResult = await ordersCollection.updateMany(
      { 'deliveryInfo.assignedDriver': '' },
      { $set: { 'deliveryInfo.assignedDriver': null } }
    );
    
    console.log(`✅ Fixed ${updateResult.modifiedCount} orders with empty assignedDriver`);
    
    // Check database state after fix
    const totalOrders = await Order.countDocuments();
    const receivedOrders = await Order.countDocuments({ status: 'Received' });
    const processingOrders = await Order.countDocuments({ status: 'Processing' });
    const assignedOrders = await Order.countDocuments({ 
      'deliveryInfo.assignedDriver': { $ne: null, $exists: true } 
    });
    
    console.log('\n📊 Database State Summary:');
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Received Status: ${receivedOrders}`);
    console.log(`   Processing Status: ${processingOrders}`);
    console.log(`   Assigned Orders: ${assignedOrders}`);
    
    console.log('\n🎉 Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAssignedDriverIssue(); 