const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./models/Order');
const DeliveryAssignment = require('./models/DeliveryAssignment');

const cleanOrdersDatabase = async () => {
  try {
    // Try MongoDB Atlas connection first, then local MongoDB
    const mongoUri = process.env.MONGO_URI || 
                     'mongodb+srv://your-atlas-connection' ||
                     'mongodb://127.0.0.1:27017/saptmarkets';
    
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });

    console.log('🔗 Connected to MongoDB successfully!');

    // Remove ALL orders except delivered ones - more thorough cleanup
    console.log('\n🧹 Cleaning ALL orders except delivered ones...');
    
    // First, let's see what statuses exist
    const existingStatuses = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📋 Current order statuses in database:');
    existingStatuses.forEach(status => {
      console.log(`   - ${status._id}: ${status.count} orders`);
    });

    // Remove ALL orders that are NOT delivered or completed
    const orderDeleteResult = await Order.deleteMany({
      status: { 
        $nin: ['delivered', 'Delivered', 'completed', 'Completed'] 
      }
    });

    console.log(`✅ Removed ${orderDeleteResult.deletedCount} non-delivered orders`);

    // Also clean up delivery assignments
    const deliveryDeleteResult = await DeliveryAssignment.deleteMany({
      status: { 
        $nin: ['delivered', 'Delivered', 'completed', 'Completed'] 
      }
    });

    console.log(`✅ Removed ${deliveryDeleteResult.deletedCount} non-completed delivery assignments`);

    // Count remaining orders and delivery assignments
    const remainingOrders = await Order.countDocuments();
    const remainingDeliveryAssignments = await DeliveryAssignment.countDocuments();
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`📊 Remaining orders in database: ${remainingOrders}`);
    console.log(`📊 Remaining delivery assignments: ${remainingDeliveryAssignments}`);

    if (remainingOrders > 0) {
      const orderStatuses = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('📈 Remaining order statuses:');
      orderStatuses.forEach(status => {
        console.log(`   - ${status._id}: ${status.count} orders`);
      });
    }

    if (remainingDeliveryAssignments > 0) {
      const deliveryStatuses = await DeliveryAssignment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('📈 Remaining delivery assignment statuses:');
      deliveryStatuses.forEach(status => {
        console.log(`   - ${status._id}: ${status.count} assignments`);
      });
    }

    console.log('\n✨ COMPLETE DATABASE CLEANUP FINISHED!');
    console.log('🔄 Your delivery app will now show ONLY fresh, clean data');
    console.log('💡 Only delivered orders remain in the database');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    console.log('\n💡 This might happen if:');
    console.log('   - MongoDB is not running');
    console.log('   - Environment variables are not set');
    console.log('   - Network connection issues');
    console.log('\n🔧 Try starting the main server first to ensure database connectivity');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the cleanup
cleanOrdersDatabase(); 