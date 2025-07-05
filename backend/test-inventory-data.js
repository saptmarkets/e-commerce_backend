// 🎸 Quick Inventory Data Test Script
// This script will help us understand if there's data in the database

const mongoose = require('mongoose');

// Connect to MongoDB (adjust the connection string as needed)
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🎸 Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product Schema (simplified)
const ProductSchema = new mongoose.Schema({
  title: mongoose.Schema.Types.Mixed,
  sku: String,
  barcode: String,
  stock: { type: Number, default: 0 },
  prices: {
    originalPrice: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  status: { type: String, default: 'show' },
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

// Order Schema (simplified)  
const OrderSchema = new mongoose.Schema({
  cart: [{
    id: mongoose.Schema.Types.ObjectId,
    title: mongoose.Schema.Types.Mixed,
    price: Number,
    quantity: Number,
    category: String
  }],
  status: String,
  total: Number,
  user: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

// Test function
const testInventoryData = async () => {
  try {
    console.log('\n🎸 ===== INVENTORY DATA TEST =====\n');

    // 1. Check total products
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total Products in Database: ${totalProducts}`);

    // 2. Check products with stock
    const productsWithStock = await Product.countDocuments({ stock: { $gt: 0 } });
    console.log(`📈 Products with Stock > 0: ${productsWithStock}`);

    // 3. Check sample products
    const sampleProducts = await Product.find({}).limit(5).select('title sku stock prices category status');
    console.log('\n📋 Sample Products:');
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. Title: ${JSON.stringify(product.title)} | SKU: ${product.sku} | Stock: ${product.stock} | Price: ${product.prices?.originalPrice || 0}`);
    });

    // 4. Check total orders
    const totalOrders = await Order.countDocuments();
    console.log(`\n📦 Total Orders in Database: ${totalOrders}`);

    // 5. Check recent orders
    const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(3).select('cart status total createdAt');
    console.log('\n📋 Recent Orders:');
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Items: ${order.cart?.length || 0} | Status: ${order.status} | Total: ${order.total} | Date: ${order.createdAt}`);
    });

    // 6. Test basic aggregation
    console.log('\n🔍 Testing Basic Aggregation:');
    const stockSummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ["$stock", "$prices.originalPrice"] } },
          totalStock: { $sum: "$stock" },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] } },
          inStock: { $sum: { $cond: [{ $gt: ["$stock", 10] }, 1, 0] } }
        }
      }
    ]);

    console.log('📊 Stock Summary:', stockSummary[0] || 'No data');

    // 7. Test category lookup
    console.log('\n🔍 Testing Category Lookup:');
    const categoryTest = await Product.aggregate([
      { $limit: 3 },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $project: {
          title: 1,
          categoryId: "$category",
          categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
          stock: 1
        }
      }
    ]);

    console.log('🏷️ Category Test Results:');
    categoryTest.forEach((item, index) => {
      console.log(`${index + 1}. Product: ${JSON.stringify(item.title)} | Category: ${JSON.stringify(item.categoryName)} | Stock: ${item.stock}`);
    });

    console.log('\n🎸 ===== TEST COMPLETE =====\n');

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🎸 Database connection closed');
    process.exit(0);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testInventoryData();
};

runTest().catch(console.error); 