#!/usr/bin/env node

/**
 * SAPTMARKETS Brand Migration Script
 * 
 * This script helps migrate from saptmarkets to SAPTMARKETS brand
 * 
 * Usage:
 * 1. Update your .env file with the new database name (optional)
 * 2. Run this script to update all hardcoded references
 * 3. Test your applications
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_UPDATE = [
  'update-admin-banners.js',
  'verify-migration.js', 
  'test-unit-name.js',
  'utils/checkPromotions.js',
  'test-promotion-creation.js',
  'test-product-unit.js',
  'test-api-response.js',
  'check-data.js',
  'check-units.js',
  'check-recent-units.js',
  'migration-script.js',
  'fix-indexes.js',
  'scripts/categories-units-migration.js',
  'scripts/category-migration.js',
  'check-product-unit.js',
  'seed-promotion-lists.js'
];

const REPLACEMENTS = [
  {
    from: /mongodb:\/\/127\.0\.0\.1:27017\/saptmarkets/g,
    to: 'mongodb://127.0.0.1:27017/saptmarkets'
  },
  {
    from: /mongodb:\/\/localhost:27017\/saptmarkets/g,
    to: 'mongodb://localhost:27017/saptmarkets'
  },
  {
    from: /'mongodb:\/\/127\.0\.0\.1:27017\/saptmarkets\?authSource=admin'/g,
    to: "'mongodb://127.0.0.1:27017/saptmarkets?authSource=admin'"
  }
];

console.log('🚀 Starting SAPTMARKETS Brand Migration...\n');

// Function to update a single file
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let updated = false;
    
    REPLACEMENTS.forEach(replacement => {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log('📂 Updating database connection strings...\n');
FILES_TO_UPDATE.forEach(updateFile);

console.log('\n🎉 Migration complete!');
console.log('\n📋 Next Steps:');
console.log('1. Create/update your .env file with:');
console.log('   MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets');
console.log('2. If you want to rename your actual database:');
console.log('   - Export: mongodump --db saptmarkets');
console.log('   - Import: mongorestore --db saptmarkets dump/saptmarkets/');
console.log('3. Test all your applications');
console.log('4. Update frontend branding (admin/customer apps)');
console.log('\n⚠️  IMPORTANT: Always backup your database before migration!'); 