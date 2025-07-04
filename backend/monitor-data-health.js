/**
 * Data health monitoring script
 * Run this periodically to detect data consistency issues before they cause problems
 */

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saptmarkets', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Monitor data health
const monitorDataHealth = async () => {
  console.log('\n🏥 Monitoring data health...\n');

  try {
    const OdooProduct = require('./models/OdooProduct');
    const OdooPricelistItem = require('./models/OdooPricelistItem');
    const OdooBarcodeUnit = require('./models/OdooBarcodeUnit');
    const Product = require('./models/Product');
    const ProductUnit = require('./models/ProductUnit');
    const Promotion = require('./models/Promotion');

    const issues = [];
    const warnings = [];
    const stats = {};

    // 1. Check for orphaned references
    console.log('1️⃣ Checking for orphaned references...');
    
    const itemsWithPromotionId = await OdooPricelistItem.find({
      store_promotion_id: { $exists: true, $ne: null }
    });
    
    let orphanedCount = 0;
    for (const item of itemsWithPromotionId) {
      const promotion = await Promotion.findById(item.store_promotion_id);
      if (!promotion) {
        orphanedCount++;
      }
    }
    
    stats.orphanedReferences = orphanedCount;
    if (orphanedCount > 0) {
      issues.push(`Found ${orphanedCount} orphaned promotion references`);
    }

    // 2. Check for missing product mappings
    console.log('2️⃣ Checking for missing product mappings...');
    
    const productsWithoutMapping = await OdooProduct.find({
      store_product_id: { $exists: false }
    });
    
    stats.missingProductMappings = productsWithoutMapping.length;
    if (productsWithoutMapping.length > 0) {
      warnings.push(`Found ${productsWithoutMapping.length} OdooProducts without store mapping`);
    }

    // 3. Check for missing barcode unit mappings
    console.log('3️⃣ Checking for missing barcode unit mappings...');
    
    const barcodeUnitsWithoutMapping = await OdooBarcodeUnit.find({
      store_product_unit_id: { $exists: false }
    });
    
    stats.missingBarcodeMappings = barcodeUnitsWithoutMapping.length;
    if (barcodeUnitsWithoutMapping.length > 0) {
      warnings.push(`Found ${barcodeUnitsWithoutMapping.length} barcode units without store mapping`);
    }

    // 4. Check for failed imports
    console.log('4️⃣ Checking for failed imports...');
    
    const failedImports = await OdooPricelistItem.find({
      _sync_status: 'failed'
    });
    
    stats.failedImports = failedImports.length;
    if (failedImports.length > 0) {
      issues.push(`Found ${failedImports.length} failed imports that need attention`);
    }

    // 5. Check for pending imports
    console.log('5️⃣ Checking for pending imports...');
    
    const pendingImports = await OdooPricelistItem.find({
      _sync_status: 'pending'
    });
    
    stats.pendingImports = pendingImports.length;
    if (pendingImports.length > 0) {
      warnings.push(`Found ${pendingImports.length} pending imports`);
    }

    // 6. Check for data consistency
    console.log('6️⃣ Checking data consistency...');
    
    const storeProducts = await Product.find({}).limit(100);
    let inconsistentMappings = 0;
    
    for (const storeProduct of storeProducts) {
      const odooProduct = await OdooProduct.findOne({ store_product_id: storeProduct._id });
      if (!odooProduct && storeProduct.sku) {
        inconsistentMappings++;
      }
    }
    
    stats.inconsistentMappings = inconsistentMappings;
    if (inconsistentMappings > 0) {
      warnings.push(`Found ${inconsistentMappings} potential inconsistent mappings in sample`);
    }

    // 7. Generate health report
    console.log('\n📊 DATA HEALTH REPORT:');
    console.log('='.repeat(50));
    
    Object.entries(stats).forEach(([key, value]) => {
      const status = value === 0 ? '✅' : value > 10 ? '❌' : '⚠️';
      console.log(`${status} ${key}: ${value}`);
    });
    
    console.log('\n🚨 ISSUES FOUND:');
    if (issues.length === 0) {
      console.log('   ✅ No critical issues found');
    } else {
      issues.forEach(issue => console.log(`   ❌ ${issue}`));
    }
    
    console.log('\n⚠️  WARNINGS:');
    if (warnings.length === 0) {
      console.log('   ✅ No warnings');
    } else {
      warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    }
    
    // 8. Health score calculation
    const totalChecks = Object.keys(stats).length;
    const healthyChecks = Object.values(stats).filter(value => value === 0).length;
    const healthScore = Math.round((healthyChecks / totalChecks) * 100);
    
    console.log('\n🏆 OVERALL HEALTH SCORE:');
    if (healthScore >= 90) {
      console.log(`   🟢 ${healthScore}% - Excellent health`);
    } else if (healthScore >= 70) {
      console.log(`   🟡 ${healthScore}% - Good health with minor issues`);
    } else if (healthScore >= 50) {
      console.log(`   🟠 ${healthScore}% - Fair health, needs attention`);
    } else {
      console.log(`   🔴 ${healthScore}% - Poor health, immediate action required`);
    }
    
    // 9. Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (issues.length > 0) {
      console.log('   🚨 CRITICAL: Run repair-data-consistency.js immediately');
    }
    
    if (warnings.length > 0) {
      console.log('   ⚠️  Run repair-data-consistency.js to fix warnings');
    }
    
    if (healthScore >= 90) {
      console.log('   ✅ System is healthy, continue monitoring');
    }
    
    console.log('   📅 Schedule: Run this monitor weekly');
    console.log('   🔧 Auto-fix: Consider running repair script after monitoring');

  } catch (error) {
    console.error('❌ Error during monitoring:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await monitorDataHealth();
  
  console.log('\n🎉 Data health monitoring completed!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

main(); 