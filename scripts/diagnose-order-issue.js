const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for diagnosis');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Diagnose order creation issue
const diagnoseOrderIssue = async () => {
  try {
    console.log('🔍 Diagnosing order creation issue...');
    
    // Test 1: Check if Order model can be imported
    console.log('\n📋 Test 1: Importing Order model...');
    let Order;
    try {
      Order = require('../models/Order');
      console.log('✅ Order model imported successfully');
    } catch (importError) {
      console.error('❌ Order model import failed:', importError.message);
      return;
    }
    
    // Test 2: Check Order schema
    console.log('\n📋 Test 2: Checking Order schema...');
    try {
      const schema = Order.schema;
      console.log('✅ Order schema exists');
      console.log('- Schema fields:', Object.keys(schema.paths).length);
      
      // Check if odooSync field exists
      if (schema.paths.odooSync) {
        console.log('✅ odooSync field exists in schema');
      } else {
        console.log('❌ odooSync field missing from schema');
      }
    } catch (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
    }
    
    // Test 3: Create minimal order
    console.log('\n📋 Test 3: Creating minimal order...');
    try {
      const minimalOrder = new Order({
        user: new mongoose.Types.ObjectId(),
        cart: [{
          productId: 'test-product',
          title: 'Test Product',
          price: 100,
          quantity: 1
        }],
        user_info: {
          name: 'Test User',
          contact: '1234567890',
          address: 'Test Address'
        },
        subTotal: 100,
        shippingCost: 0,
        total: 100,
        paymentMethod: 'COD',
        status: 'Received'
      });
      
      console.log('✅ Minimal order created');
      console.log('- odooSync before save:', minimalOrder.odooSync);
      
      const savedOrder = await minimalOrder.save();
      console.log('✅ Order saved successfully');
      console.log('- Invoice:', savedOrder.invoice);
      console.log('- odooSync after save:', savedOrder.odooSync);
      
      // Clean up
      await Order.findByIdAndDelete(savedOrder._id);
      console.log('✅ Test order cleaned up');
      
    } catch (orderError) {
      console.error('❌ Order creation failed:', orderError.message);
      console.error('Error details:', orderError);
      
      // Check if it's a validation error
      if (orderError.name === 'ValidationError') {
        console.log('\n🔍 Validation errors:');
        Object.keys(orderError.errors).forEach(field => {
          console.log(`- ${field}: ${orderError.errors[field].message}`);
        });
      }
    }
    
    // Test 4: Check database indexes
    console.log('\n📋 Test 4: Checking database indexes...');
    try {
      const indexes = await Order.collection.getIndexes();
      console.log('✅ Database indexes retrieved');
      console.log('- Total indexes:', Object.keys(indexes).length);
      
      // Check for odooSync indexes
      const odooSyncIndexes = Object.keys(indexes).filter(name => 
        name.includes('odooSync')
      );
      console.log('- odooSync indexes:', odooSyncIndexes);
      
    } catch (indexError) {
      console.error('❌ Index check failed:', indexError.message);
    }
    
    console.log('\n🎉 Diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run diagnosis
connectDB().then(diagnoseOrderIssue);
