// Utility to check promotions in the database
require('dotenv').config();
const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saptmarkets';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
}

async function checkPromotions() {
  try {
    await connectDB();
    
    // Get all promotions
    const allPromotions = await Promotion.find({})
      .populate('product', 'title slug sku image')
      .lean();
    
    console.log(`\nTotal promotions: ${allPromotions.length}`);
    
    if (allPromotions.length === 0) {
      console.log('No promotions found in the database.');
      return;
    }
    
    // Get active promotions
    const currentDate = new Date();
    const activePromotions = await Promotion.find({
      status: 'active',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).lean();
    
    console.log(`Active promotions: ${activePromotions.length}`);
    
    // Log promotion details
    console.log('\n=== Promotion Summary ===');
    allPromotions.forEach((promotion, index) => {
      console.log(`\n[${index + 1}] ${promotion.name} (${promotion._id})`);
      console.log(`- Product: ${promotion.product?.title?.en || 'Unknown'} (${promotion.product?._id || 'N/A'})`);
      console.log(`- Price: ${promotion.offerPrice}`);
      console.log(`- Quantity: ${promotion.minQty} - ${promotion.maxQty} ${promotion.unit}`);
      console.log(`- Date: ${new Date(promotion.startDate).toLocaleDateString()} to ${new Date(promotion.endDate).toLocaleDateString()}`);
      console.log(`- Status: ${promotion.status}`);
      
      // Check if promotion is active based on dates
      const isActiveByDates = 
        currentDate >= new Date(promotion.startDate) && 
        currentDate <= new Date(promotion.endDate);
      
      // Check if the status matches the date logic
      const statusMatchesDates = 
        (promotion.status === 'active' && isActiveByDates) || 
        (promotion.status !== 'active' && !isActiveByDates);
      
      if (!statusMatchesDates) {
        console.log(`  ⚠️ Warning: Status (${promotion.status}) doesn't match date validity (${isActiveByDates ? 'should be active' : 'should not be active'})`);
      }
      
      // Check if product exists
      if (!promotion.product) {
        console.log(`  ⚠️ Warning: Product is missing or not populated`);
      }
    });
  } catch (err) {
    console.error('Error checking promotions:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the check
checkPromotions(); 