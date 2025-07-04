const mongoose = require('mongoose');
const Order = require('./models/Order');
const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugOrderAssignment() {
  try {
    console.log('🔍 Debugging Order Assignment...\n');
    
    // Test order ID from logs
    const orderId = '685b032e2871592b18646625';
    const currentDriverId = '685717fd5884851968d91cf3';
    
    console.log('📋 Order ID:', orderId);
    console.log('👤 Current Driver ID:', currentDriverId);
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('\n📦 Order Details:');
    console.log('- Invoice:', order.invoice);
    console.log('- Status:', order.status);
    console.log('- Created:', order.createdAt);
    
    console.log('\n🚚 Delivery Info:');
    console.log('- Assigned Driver:', order.deliveryInfo?.assignedDriver);
    console.log('- Assigned At:', order.deliveryInfo?.assignedAt);
    console.log('- Delivery Info exists:', !!order.deliveryInfo);
    
    // Check if assigned driver exists
    if (order.deliveryInfo?.assignedDriver) {
      try {
        const assignedDriver = await Admin.findById(order.deliveryInfo.assignedDriver);
        if (assignedDriver) {
          console.log('- Assigned Driver Name:', assignedDriver.name?.en || assignedDriver.email);
          console.log('- Assigned Driver Role:', assignedDriver.role);
        } else {
          console.log('- ⚠️ Assigned Driver ID exists but driver not found in database');
        }
      } catch (err) {
        console.log('- ❌ Error finding assigned driver:', err.message);
      }
    }
    
    // Check current driver
    const currentDriver = await Admin.findById(currentDriverId);
    if (currentDriver) {
      console.log('\n👤 Current Driver:');
      console.log('- Name:', currentDriver.name?.en || currentDriver.email);
      console.log('- Role:', currentDriver.role);
      console.log('- Is same as assigned?', order.deliveryInfo?.assignedDriver?.toString() === currentDriverId);
    }
    
    // Check assignment logic
    console.log('\n🔄 Assignment Logic Check:');
    const assignedDriver = order.deliveryInfo?.assignedDriver;
    const isAssignedToCurrentDriver = assignedDriver && assignedDriver.toString() === currentDriverId;
    const isUnassigned = !assignedDriver || assignedDriver === '' || assignedDriver === null;
    const isAssignedToOther = assignedDriver && assignedDriver !== '' && assignedDriver.toString() !== currentDriverId;
    
    console.log('- Is assigned to current driver:', isAssignedToCurrentDriver);
    console.log('- Is unassigned:', isUnassigned);
    console.log('- Is assigned to other driver:', isAssignedToOther);
    
    // Fix recommendation
    console.log('\n💡 Recommendation:');
    if (isAssignedToOther) {
      console.log('- Order is assigned to another driver');
      console.log('- To fix: Set deliveryInfo.assignedDriver to null or empty string');
      console.log('- Or: Create a new unassigned order for testing');
    } else if (isUnassigned) {
      console.log('- Order is unassigned and ready to be accepted');
    } else if (isAssignedToCurrentDriver) {
      console.log('- Order is already assigned to current driver');
    }
    
    // Show all orders for this driver
    console.log('\n📋 All Orders Available to Driver:');
    const availableOrders = await Order.find({
      $or: [
        { 'deliveryInfo.assignedDriver': currentDriverId },
        { 
          'deliveryInfo.assignedDriver': { $exists: false },
          status: { $in: ['Processing', 'Pending'] }
        },
        { 
          'deliveryInfo.assignedDriver': null,
          status: { $in: ['Processing', 'Pending'] }
        },
        { 
          'deliveryInfo.assignedDriver': '',
          status: { $in: ['Processing', 'Pending'] }
        }
      ]
    }).limit(10);
    
    availableOrders.forEach((order, index) => {
      const assignedDriver = order.deliveryInfo?.assignedDriver;
      const assignmentStatus = !assignedDriver || assignedDriver === '' || assignedDriver === null 
        ? 'UNASSIGNED' 
        : (assignedDriver.toString() === currentDriverId ? 'ASSIGNED TO YOU' : 'ASSIGNED TO OTHER');
      
      console.log(`${index + 1}. Order ${order.invoice} - Status: ${order.status} - Assignment: ${assignmentStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugOrderAssignment(); 