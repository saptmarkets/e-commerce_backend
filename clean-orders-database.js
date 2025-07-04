const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('./models/Order');
const DeliveryPersonnel = require('./models/DeliveryPersonnel');

const cleanOrdersDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');

    // Remove all orders with unwanted statuses
    const statusesToRemove = [
      'pending', 
      'processing', 
      'cancelled', 
      'confirmed',
      'preparing',
      'ready-for-pickup',
      'out-for-delivery',
      'on-the-way'
    ];

    console.log('\n🧹 Cleaning up orders...');
    
    // Remove orders with specified statuses
    const orderDeleteResult = await Order.deleteMany({
      status: { $in: statusesToRemove }
    });

    console.log(`✅ Removed ${orderDeleteResult.deletedCount} orders with statuses: ${statusesToRemove.join(', ')}`);

    // Also remove any orders assigned to delivery personnel that aren't delivered
    const deliveryOrderDeleteResult = await Order.deleteMany({
      'delivery.status': { $in: ['assigned', 'picked-up', 'out-for-delivery'] }
    });

    console.log(`✅ Removed ${deliveryOrderDeleteResult.deletedCount} delivery orders that weren't completed`);

    // Reset delivery personnel assigned orders
    const resetDeliveryPersonnel = await DeliveryPersonnel.updateMany(
      {},
      {
        $unset: {
          'currentOrders': 1,
          'assignedOrders': 1
        },
        $set: {
          'performance.totalDeliveries': 0,
          'performance.completedToday': 0,
          'performance.totalEarnings': 0,
          'performance.rating': 5.0,
          'currentStatus': 'available',
          'isOnDuty': false
        }
      }
    );

    console.log(`✅ Reset ${resetDeliveryPersonnel.modifiedCount} delivery personnel records`);

    // Count remaining orders (should be only delivered ones, if any)
    const remainingOrders = await Order.countDocuments();
    console.log(`📊 Remaining orders in database: ${remainingOrders}`);

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

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('🔄 Your delivery app will now show fresh, clean data');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the cleanup
cleanOrdersDatabase(); 