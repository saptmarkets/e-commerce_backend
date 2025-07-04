#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive SAPTMARKETS migration...\n');

// 1. Update .env file
async function updateEnvFile() {
  try {
    console.log('📝 Updating .env file...');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update environment variables
    const updates = {
      'MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets\\?authSource=admin': 'MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets?authSource=admin',
      'JWT_SECRET=saptmarkets-jwt-secret-key-local': 'JWT_SECRET=saptmarkets-jwt-secret-key-local',
      'JWT_SECRET_FOR_VERIFY=saptmarkets-jwt-secret-for-verify-local': 'JWT_SECRET_FOR_VERIFY=saptmarkets-jwt-secret-for-verify-local',
      'ENCRYPT_PASSWORD=your-secret-encryption-key-saptmarkets': 'ENCRYPT_PASSWORD=your-secret-encryption-key-saptmarkets'
    };
    
    Object.entries(updates).forEach(([oldValue, newValue]) => {
      const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      envContent = envContent.replace(regex, newValue);
    });
    
    // Add missing variables if they don't exist
    const requiredVars = {
      'SENDGRID_API_KEY': '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',
      'SENDER_EMAIL': 'itadmin@saptmarkets.com'
    };
    
    Object.entries(requiredVars).forEach(([key, value]) => {
      if (!envContent.includes(`${key}=`)) {
        envContent += `${key}=${value}\n`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

// 2. Update auth.js default encryption key
async function updateAuthConfig() {
  try {
    console.log('🔐 Updating auth.js encryption key...');
    
    const authPath = path.join(__dirname, 'config', 'auth.js');
    let authContent = fs.readFileSync(authPath, 'utf8');
    
    // Update the default encryption key
    authContent = authContent.replace(
      /'saptmarkets-default-encryption-key-123'/g,
      "'saptmarkets-default-encryption-key-123'"
    );
    
    fs.writeFileSync(authPath, authContent);
    console.log('✅ auth.js updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating auth.js:', error.message);
  }
}

// 3. Update email templates
async function updateEmailTemplates() {
  try {
    console.log('📧 Updating email templates...');
    
    const templatesDir = path.join(__dirname, 'lib', 'email-sender', 'templates');
    const templateFiles = [
      'register/index.js',
      'forget-password/index.js',
      'support-message/index.js',
      'order-to-customer/index.js',
      'add-staff/index.js'
    ];
    
    templateFiles.forEach(templateFile => {
      const templatePath = path.join(templatesDir, templateFile);
      if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, 'utf8');
        
        // Update branding references
        content = content.replace(/saptmarkets/g, 'SAPTMARKETS');
        content = content.replace(/saptmarkets/g, 'saptmarkets');
        content = content.replace(/support@saptmarkets\.com/g, 'support@saptmarkets.com');
        
        fs.writeFileSync(templatePath, content);
        console.log(`   ✅ Updated ${templateFile}`);
      }
    });
    
    console.log('✅ Email templates updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating email templates:', error.message);
  }
}

// 4. Update admin controller email content
async function updateAdminController() {
  try {
    console.log('👤 Updating admin controller...');
    
    const controllerPath = path.join(__dirname, 'controller', 'adminController.js');
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Update email content
    content = content.replace(/saptmarkets/g, 'SAPTMARKETS');
    content = content.replace(/support@saptmarkets\.com/g, 'support@saptmarkets.com');
    
    fs.writeFileSync(controllerPath, content);
    console.log('✅ Admin controller updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating admin controller:', error.message);
  }
}

// 5. Update user controller
async function updateUserController() {
  try {
    console.log('👤 Updating user controller...');
    
    const controllerPath = path.join(__dirname, 'controller', 'userController.js');
    let content = fs.readFileSync(controllerPath, 'utf8');
    
    // Update email subject
    content = content.replace(/saptmarkets/g, 'SAPTMARKETS');
    
    fs.writeFileSync(controllerPath, content);
    console.log('✅ User controller updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating user controller:', error.message);
  }
}

// 6. Update config seed file
async function updateConfigSeed() {
  try {
    console.log('🌱 Updating config seed...');
    
    const seedPath = path.join(__dirname, 'config', 'seed.js');
    if (fs.existsSync(seedPath)) {
      let content = fs.readFileSync(seedPath, 'utf8');
      
      // Update meta information
      content = content.replace(/saptmarkets - React eCommerce Template/g, 'SAPTMARKETS - React eCommerce Template');
      content = content.replace(/saptmarkets is a React eCommerce template/g, 'SAPTMARKETS is a React eCommerce template');
      content = content.replace(/https:\/\/saptmarkets\.com/g, 'https://saptmarkets.com');
      
      fs.writeFileSync(seedPath, content);
      console.log('✅ Config seed updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error updating config seed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('⚠️  IMPORTANT: This will update your environment variables and code');
  console.log('⚠️  All existing JWT tokens will become invalid');
  console.log('⚠️  Users will need to log in again\n');
  
  await updateEnvFile();
  await updateAuthConfig();
  await updateEmailTemplates();
  await updateAdminController();
  await updateUserController();
  await updateConfigSeed();
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Important next steps:');
  console.log('1. Restart your backend server');
  console.log('2. All users will need to log in again (JWT tokens invalidated)');
  console.log('3. Admin access lists will need to be re-encrypted');
  console.log('4. Test all email functionality');
  console.log('5. Verify all authentication flows work correctly');
  
  process.exit(0);
}

main().catch(console.error); 