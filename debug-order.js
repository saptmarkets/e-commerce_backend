const mongoose = require('mongoose');
const Order = require('../backend/models/Order');
require('dotenv').config({ path: '../backend/.env' });

async function checkOrder() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('🔍 Looking for order #ee8b66...');
    const order = await Order.findOne({ 
      $or: [
        { invoice: 'ee8b66' },
        { invoice: '#ee8b66' },
        { _id: 'ee8b66' }
      ]
    }).lean();
    
    if (order) {
      console.log('✅ Order found:');
      console.log('   - ID:', order._id);
      console.log('   - Invoice:', order.invoice);
      console.log('   - Status:', order.status);
      console.log('   - Cart items:', order.cart?.length || 0);
      
      if (order.cart && order.cart.length > 0) {
        console.log('\n📦 Cart structure:');
        order.cart.forEach((item, index) => {
          console.log(`   Item ${index + 1}:`);
          console.log('     - Title:', item.title);
          console.log('     - IsCombo:', item.isCombo);
          console.log('     - Quantity:', item.quantity);
          console.log('     - Price:', item.price);
          if (item.selectedProducts) {
            console.log('     - SelectedProducts:', JSON.stringify(item.selectedProducts, null, 6));
          }
          if (item.comboDetails) {
            console.log('     - ComboDetails:', JSON.stringify(item.comboDetails, null, 6));
          }
        });
      }
      
      console.log('\n🚚 Delivery Info:');
      console.log('   - ProductChecklist exists:', !!order.deliveryInfo?.productChecklist);
      console.log('   - ProductChecklist length:', order.deliveryInfo?.productChecklist?.length || 0);
      
    } else {
      console.log('❌ Order not found! Looking for any orders with similar invoice...');
      const orders = await Order.find({}).select('invoice _id status').limit(10);
      console.log('Recent orders:', orders.map(o => ({ id: o._id, invoice: o.invoice, status: o.status })));
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrder(); 