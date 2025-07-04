const mongoose = require('mongoose');
require('./models/Order');
require('./models/Customer');
require('./models/Product');
const Order = mongoose.model('Order');

async function debugComboPricing() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin');
    console.log('Connected to database');
    
    // Get the recent combo order
    const order = await Order.findById('6858959eeb0b2d40e0e7f249');
    
    console.log('🔍 Analyzing Combo Pricing Logic');
    console.log('================================');
    
    const comboItem = order.cart[0];
    console.log('📦 Combo Item Details:');
    console.log(`- Title: ${comboItem.title}`);
    console.log(`- Quantity: ${comboItem.quantity}`);
    console.log(`- Price: ${comboItem.price}`);
    console.log(`- Total Value: ${comboItem.comboDetails.totalValue}`);
    console.log(`- Required Item Count: ${comboItem.comboDetails.requiredItemCount}`);
    
    console.log('\n📋 Product Breakdown:');
    comboItem.comboDetails.productBreakdown.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productTitle}:`);
      console.log(`   - Quantity in combo: ${product.quantity}`);
      console.log(`   - Unit Price: ${product.unitPrice}`);
      console.log(`   - Product Total: ${product.quantity * product.unitPrice}`);
    });
    
    console.log('\n🧮 Current Calculation Analysis:');
    console.log('================================');
    
    const totalItemsPerCombo = comboItem.comboDetails.requiredItemCount; // Should be 8
    const comboQuantity = comboItem.quantity; // 9 combo packs
    const totalValue = comboItem.comboDetails.totalValue; // Total price for all combos
    
    console.log(`- Customer ordered: ${comboQuantity} combo packs`);
    console.log(`- Each combo pack contains: ${totalItemsPerCombo} items total`);
    console.log(`- Total value for all combos: ${totalValue}`);
    
    // Calculate correct pricing
    const pricePerCombo = totalValue / comboQuantity;
    const pricePerPiece = pricePerCombo / totalItemsPerCombo;
    
    console.log(`- Price per combo pack: ${pricePerCombo.toFixed(2)}`);
    console.log(`- Price per individual piece: ${pricePerPiece.toFixed(2)}`);
    
    console.log('\n✅ Correct Delivery Calculation:');
    console.log('================================');
    
    comboItem.comboDetails.productBreakdown.forEach((product, index) => {
      const totalQuantityForDelivery = product.quantity * comboQuantity;
      const totalPriceForProduct = totalQuantityForDelivery * pricePerPiece;
      
      console.log(`${index + 1}. ${product.productTitle}:`);
      console.log(`   - Quantity per combo: ${product.quantity}`);
      console.log(`   - Total quantity to deliver: ${product.quantity} × ${comboQuantity} = ${totalQuantityForDelivery}`);
      console.log(`   - Price per piece: ${pricePerPiece.toFixed(2)}`);
      console.log(`   - Total price for this product: ${totalPriceForProduct.toFixed(2)}`);
    });
    
    // Verify the math
    const totalItemsToDeliver = comboItem.comboDetails.productBreakdown.reduce((sum, product) => {
      return sum + (product.quantity * comboQuantity);
    }, 0);
    
    const expectedTotalItems = totalItemsPerCombo * comboQuantity;
    
    console.log('\n🔍 Verification:');
    console.log(`- Expected total items: ${totalItemsPerCombo} × ${comboQuantity} = ${expectedTotalItems}`);
    console.log(`- Calculated total items: ${totalItemsToDeliver}`);
    console.log(`- Match: ${totalItemsToDeliver === expectedTotalItems ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugComboPricing(); 