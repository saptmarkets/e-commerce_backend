// Test script to verify delivery system functionality
require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");

const Admin = require("./models/Admin");
const Order = require("./models/Order");

async function testDeliverySystem() {
  try {
    // Connect to database
    await connectDB();
    console.log("🔗 Connected to database");

    // Test 1: Check if we have drivers
    const drivers = await Admin.find({ role: "Driver", status: "Active" });
    console.log(`\n👥 Found ${drivers.length} active drivers:`);
    drivers.forEach(driver => {
      console.log(`  - ${driver.name.en} (${driver.email}) - OnDuty: ${driver.deliveryInfo?.isOnDuty || false}`);
    });

    // Test 2: Check pending orders
    const pendingOrders = await Order.find({
      status: 'Pending',
      $or: [
        { 'deliveryInfo.assignedDriver': { $exists: false } },
        { 'deliveryInfo.assignedDriver': null }
      ]
    });
    console.log(`\n📦 Found ${pendingOrders.length} pending orders (unassigned):`);
    pendingOrders.forEach(order => {
      console.log(`  - Order #${order.invoice} - ${order.user_info?.name} - $${order.total}`);
    });

    // Test 3: Check assigned orders
    const assignedOrders = await Order.find({
      status: { $in: ['Processing', 'Out for Delivery'] },
      'deliveryInfo.assignedDriver': { $exists: true }
    }).populate('deliveryInfo.assignedDriver', 'name email');
    
    console.log(`\n🚚 Found ${assignedOrders.length} orders assigned to drivers:`);
    assignedOrders.forEach(order => {
      const driverName = order.deliveryInfo?.assignedDriver?.name?.en || 'Unknown';
      console.log(`  - Order #${order.invoice} → ${driverName} - Status: ${order.status}`);
      if (order.deliveryInfo?.productChecklist) {
        const collected = order.deliveryInfo.productChecklist.filter(item => item.collected).length;
        const total = order.deliveryInfo.productChecklist.length;
        console.log(`    Products collected: ${collected}/${total}`);
      }
    });

    // Test 4: Check completed orders
    const completedOrders = await Order.find({
      status: 'Delivered',
      'deliveryInfo.assignedDriver': { $exists: true }
    }).populate('deliveryInfo.assignedDriver', 'name email');

    console.log(`\n✅ Found ${completedOrders.length} completed deliveries:`);
    completedOrders.slice(0, 5).forEach(order => {
      const driverName = order.deliveryInfo?.assignedDriver?.name?.en || 'Unknown';
      const deliveredAt = order.deliveryInfo?.deliveredAt ? 
        new Date(order.deliveryInfo.deliveredAt).toLocaleDateString() : 'Unknown';
      console.log(`  - Order #${order.invoice} by ${driverName} on ${deliveredAt}`);
    });

    // Test 5: Driver statistics
    console.log(`\n📊 Driver Performance:`);
    for (const driver of drivers) {
      const totalAssigned = await Order.countDocuments({
        'deliveryInfo.assignedDriver': driver._id
      });
      const completed = await Order.countDocuments({
        'deliveryInfo.assignedDriver': driver._id,
        status: 'Delivered'
      });
      const active = await Order.countDocuments({
        'deliveryInfo.assignedDriver': driver._id,
        status: { $in: ['Processing', 'Out for Delivery'] }
      });

      console.log(`  - ${driver.name.en}:`);
      console.log(`    Total assigned: ${totalAssigned}, Completed: ${completed}, Active: ${active}`);
      console.log(`    Success rate: ${totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0}%`);
    }

    console.log(`\n🎯 System Status Summary:`);
    console.log(`   Active Drivers: ${drivers.length}`);
    console.log(`   On-Duty Drivers: ${drivers.filter(d => d.deliveryInfo?.isOnDuty).length}`);
    console.log(`   Pending Orders: ${pendingOrders.length}`);
    console.log(`   Active Deliveries: ${assignedOrders.length}`);
    console.log(`   Completed Orders: ${completedOrders.length}`);

    if (pendingOrders.length > 0 && drivers.filter(d => d.deliveryInfo?.isOnDuty).length > 0) {
      console.log(`\n⚠️  Warning: There are ${pendingOrders.length} pending orders but drivers are available. Check auto-assignment logic.`);
    }

    if (pendingOrders.length === 0 && assignedOrders.length > 0) {
      console.log(`\n✅ Great! All orders are assigned and being processed.`);
    }

    if (drivers.length === 0) {
      console.log(`\n❌ No drivers found! Create a driver account first.`);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the test
console.log("🧪 Testing Delivery System...");
testDeliverySystem(); 