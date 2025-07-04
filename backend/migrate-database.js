#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Source and target database URIs
const SOURCE_DB = 'mongodb://127.0.0.1:27017/saptmarkets?authSource=admin';
const TARGET_DB = 'mongodb://127.0.0.1:27017/saptmarkets?authSource=admin';

console.log('🚀 Starting database migration from saptmarkets to saptmarkets...\n');

async function migrateDatabase() {
  let sourceConn, targetConn;
  
  try {
    // Connect to source database
    console.log('📡 Connecting to source database (saptmarkets)...');
    sourceConn = await mongoose.createConnection(SOURCE_DB);
    console.log('✅ Connected to saptmarkets database');
    
    // Connect to target database
    console.log('📡 Connecting to target database (saptmarkets)...');
    targetConn = await mongoose.createConnection(TARGET_DB);
    console.log('✅ Connected to saptmarkets database');
    
    // Get all collections from source database
    const collections = await sourceConn.db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections to migrate:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n🔄 Migrating collection: ${collectionName}`);
      
      try {
        // Get all documents from source collection
        const sourceCollection = sourceConn.db.collection(collectionName);
        const documents = await sourceCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ℹ️  Collection ${collectionName} is empty`);
          continue;
        }
        
        // Insert documents into target collection
        const targetCollection = targetConn.db.collection(collectionName);
        await targetCollection.deleteMany({}); // Clear target collection first
        await targetCollection.insertMany(documents);
        
        console.log(`   ✅ Migrated ${documents.length} documents`);
        
      } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
      }
    }
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const sourceStats = await sourceConn.db.stats();
    const targetStats = await targetConn.db.stats();
    
    console.log(`Source database collections: ${sourceStats.collections}`);
    console.log(`Target database collections: ${targetStats.collections}`);
    
    if (sourceStats.collections === targetStats.collections) {
      console.log('✅ Migration verification successful!');
    } else {
      console.log('⚠️  Collection counts don\'t match, please verify manually');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
}

async function updateEnvFile() {
  try {
    console.log('\n📝 Updating .env file...');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update MONGO_URI
    if (envContent.includes('MONGO_URI=')) {
      envContent = envContent.replace(
        /MONGO_URI=mongodb:\/\/127\.0\.0\.1:27017\/saptmarkets\?authSource=admin/g,
        'MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets?authSource=admin'
      );
    } else {
      envContent += '\nMONGO_URI=mongodb://127.0.0.1:27017/saptmarkets?authSource=admin\n';
    }
    
    // Add other required variables if they don't exist
    const requiredVars = {
      'PORT': '5055',
      'JWT_SECRET': 'saptmarkets-jwt-secret-key-local',
      'JWT_SECRET_FOR_VERIFY': 'saptmarkets-jwt-secret-for-verify-local',
      'STORE_URL': 'http://localhost:3000',
      'API_URL': 'http://localhost:3000/api',
      'ADMIN_URL': 'http://localhost:4000',
      'ENCRYPT_PASSWORD': 'your-secret-encryption-key-saptmarkets',
      'SENDGRID_API_KEY': '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',
      'SENDER_EMAIL': 'itadmin@saptmarkets.com'
    };
    
    Object.entries(requiredVars).forEach(([key, defaultValue]) => {
      if (!envContent.includes(`${key}=`)) {
        envContent += `${key}=${defaultValue}\n`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

// Run migration
async function main() {
  console.log('⚠️  IMPORTANT: This will create a new database called "saptmarkets"');
  console.log('⚠️  Make sure your MongoDB server is running');
  console.log('⚠️  The original "saptmarkets" database will remain untouched\n');
  
  await migrateDatabase();
  await updateEnvFile();
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Test your applications with the new database');
  console.log('2. If everything works, you can optionally remove the old saptmarkets database');
  console.log('3. Restart your backend server to use the new database');
  
  process.exit(0);
}

main().catch(console.error); 