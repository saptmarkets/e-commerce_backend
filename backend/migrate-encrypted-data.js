#!/usr/bin/env node

const mongoose = require('mongoose');
const crypto = require('crypto');
const Admin = require('./models/Admin');

console.log('🔐 Starting encrypted data migration...\n');

// Old encryption key (saptmarkets)
const oldSecretKey = 'saptmarkets-default-encryption-key-123';
const oldKey = crypto.createHash("sha256").update(String(oldSecretKey)).digest();

// New encryption key (saptmarkets)
const newSecretKey = 'saptmarkets-default-encryption-key-123';
const newKey = crypto.createHash("sha256").update(String(newSecretKey)).digest();

// Decrypt with old key
const decryptWithOldKey = (encryptedData, ivHex) => {
  if (!encryptedData || !ivHex) {
    return null;
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", oldKey, iv);
    let decryptedData = decipher.update(encryptedData, "hex", "utf8");
    decryptedData += decipher.final("utf8");
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error("Decryption error with old key:", error);
    return null;
  }
};

// Encrypt with new key
const encryptWithNewKey = (data) => {
  if (!data) {
    return { data: '', iv: '' };
  }
  
  const iv = crypto.randomBytes(16);
  const dataToEncrypt = typeof data === "string" ? data : JSON.stringify(data);

  const cipher = crypto.createCipheriv("aes-256-cbc", newKey, iv);
  let encryptedData = cipher.update(dataToEncrypt, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return {
    data: encryptedData,
    iv: iv.toString("hex"),
  };
};

async function migrateEncryptedData() {
  try {
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saptmarkets?authSource=admin');
    console.log('✅ Connected to database');
    
    // Get all admin users
    const admins = await Admin.find({});
    console.log(`\n🔍 Found ${admins.length} admin users to process`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const admin of admins) {
      console.log(`\n👤 Processing admin: ${admin.name} (${admin.email})`);
      
      // Check if admin has encrypted data in the database
      // Note: This is a simplified check - you might need to adjust based on your actual data structure
      if (admin.access_list && Array.isArray(admin.access_list)) {
        console.log(`   📋 Found access list with ${admin.access_list.length} items`);
        
        // Re-encrypt the access list with new key
        const { data: newEncryptedData, iv: newIv } = encryptWithNewKey(admin.access_list);
        
        // Update the admin record
        admin.encrypted_access_data = newEncryptedData;
        admin.encrypted_access_iv = newIv;
        await admin.save();
        
        console.log(`   ✅ Migrated access list for ${admin.name}`);
        migratedCount++;
      } else {
        console.log(`   ⏭️  No access list found for ${admin.name}`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Migrated: ${migratedCount} admins`);
    console.log(`   ⏭️  Skipped: ${skippedCount} admins`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Main execution
async function main() {
  console.log('⚠️  IMPORTANT: This will re-encrypt admin access data');
  console.log('⚠️  Make sure you have backed up your database\n');
  
  await migrateEncryptedData();
  
  console.log('\n📋 Next steps:');
  console.log('1. Restart your backend server');
  console.log('2. Test admin login functionality');
  console.log('3. Verify admin access permissions work correctly');
  
  process.exit(0);
}

main().catch(console.error); 