const mongoose = require('mongoose');
const Order = require('./models/Order');
const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixOrderAssignment() {
  try {
    console.log('🔧 Fixing Order Assignment...\n');
    
    // Test order ID from logs
    const orderId = '685b032e2871592b18646625';
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('📦 Order Details:');
    console.log('- Invoice:', order.invoice);
    console.log('- Status:', order.status);
    console.log('- Current Assigned Driver:', order.deliveryInfo?.assignedDriver);
    
    // Check if assigned driver exists
    if (order.deliveryInfo?.assignedDriver) {
      try {
        const assignedDriver = await Admin.findById(order.deliveryInfo.assignedDriver);
        if (assignedDriver) {
          console.log('- Assigned Driver Name:', assignedDriver.name?.en || assignedDriver.email);
        } else {
          console.log('- ⚠️ Assigned Driver ID exists but driver not found');
        }
      } catch (err) {
        console.log('- ❌ Error finding assigned driver:', err.message);
      }
    }
    
    // Fix: Unassign the order to make it available for acceptance
    console.log('\n🔄 Unassigning order to make it available...');
    
    // Initialize delivery info if it doesn't exist
    if (!order.deliveryInfo) {
      order.deliveryInfo = {};
    }
    
    // Clear the assignment
    order.deliveryInfo.assignedDriver = null;
    order.deliveryInfo.assignedAt = null;
    
    // Save the order
    await order.save();
    
    console.log('✅ Order unassigned successfully!');
    console.log('- Order is now available for any driver to accept');
    
    // Verify the change
    const updatedOrder = await Order.findById(orderId);
    console.log('\n🔍 Verification:');
    console.log('- Assigned Driver:', updatedOrder.deliveryInfo?.assignedDriver);
    console.log('- Is unassigned:', !updatedOrder.deliveryInfo?.assignedDriver);
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrderAssignment(); 