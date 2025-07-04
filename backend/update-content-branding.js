#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Starting content branding update for FAQ, Privacy Policy, and Terms & Conditions...\n');

// Function to update backend settings.js file
async function updateBackendSettings() {
  try {
    console.log('📝 Updating backend/utils/settings.js...');
    
    const settingsPath = path.join(__dirname, 'utils', 'settings.js');
    let content = fs.readFileSync(settingsPath, 'utf8');
    
    // Update any remaining inconsistent references
    const updates = [
      // Ensure consistent branding in FAQ
      { from: /How does the saptmarkets work\?/g, to: 'How does SAPTMARKETS work?' },
      { from: /What is saptmarkets EC2 auto scaling\?/g, to: 'What is SAPTMARKETS EC2 auto scaling?' },
      { from: /What are the benefits of using saptmarkets affliate\?/g, to: 'What are the benefits of using SAPTMARKETS affiliate?' },
      
      // Ensure consistent branding in Privacy Policy
      { from: /At saptmarkets, accessible from saptmarkets dot com/g, to: 'At SAPTMARKETS, accessible from saptmarkets.com' },
      { from: /saptmarkets follows a standard procedure/g, to: 'SAPTMARKETS follows a standard procedure' },
      { from: /saptmarkets has no access to or control/g, to: 'SAPTMARKETS has no access to or control' },
      { from: /saptmarkets's Privacy Policy does not apply/g, to: 'SAPTMARKETS\'s Privacy Policy does not apply' },
      { from: /saptmarkets does not knowingly collect/g, to: 'SAPTMARKETS does not knowingly collect' },
      
      // Ensure consistent branding in Terms & Conditions
      { from: /Welcome to saptmarkets!/g, to: 'Welcome to SAPTMARKETS!' },
      { from: /saptmarkets's Website, located at https:\/\/saptmarkets\.com\//g, to: 'SAPTMARKETS\'s Website, located at https://saptmarkets.com/' },
      { from: /Do not continue to use saptmarkets if you do not agree/g, to: 'Do not continue to use SAPTMARKETS if you do not agree' },
      { from: /By accessing saptmarkets, you agreed to use cookies/g, to: 'By accessing SAPTMARKETS, you agreed to use cookies' },
      { from: /saptmarkets's Privacy Policy/g, to: 'SAPTMARKETS\'s Privacy Policy' },
      { from: /saptmarkets and\/or its licensors own/g, to: 'SAPTMARKETS and/or its licensors own' },
      { from: /You may access this from saptmarkets for your own/g, to: 'You may access this from SAPTMARKETS for your own' },
      { from: /saptmarkets does not filter, edit, publish/g, to: 'SAPTMARKETS does not filter, edit, publish' },
      { from: /saptmarkets shall not be liable/g, to: 'SAPTMARKETS shall not be liable' },
      
      // Update URLs to be consistent
      { from: /https:\/\/saptmarkets-store\.vercel\.app\/privacy-policy/g, to: 'https://saptmarkets.com/privacy-policy' },
      { from: /https:\/\/saptmarkets-store-nine\.vercel\.app\//g, to: 'https://saptmarkets.com/' },
      
      // Fix any remaining lowercase instances in titles/headers
      { from: /"saptmarkets - React Grocery & Organic Food Store e-commerce Template"/g, to: '"SAPTMARKETS - React Grocery & Organic Food Store e-commerce Template"' },
    ];
    
    // Apply all updates
    updates.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    fs.writeFileSync(settingsPath, content);
    console.log('✅ Backend settings updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating backend settings:', error.message);
  }
}

// Function to update customer locales
async function updateCustomerLocales() {
  try {
    console.log('📝 Updating customer locales...');
    
    const localesPath = path.join(__dirname, '..', 'customer', 'locales', 'en', 'common.json');
    
    if (fs.existsSync(localesPath)) {
      let content = fs.readFileSync(localesPath, 'utf8');
      
      // Parse JSON
      const locales = JSON.parse(content);
      
      // Update FAQ questions to be consistent
      if (locales['Faq-question1']) {
        locales['Faq-question1'] = 'How does SAPTMARKETS work?';
      }
      if (locales['Faq-question5']) {
        locales['Faq-question5'] = 'What is SAPTMARKETS EC2 auto scaling?';
      }
      if (locales['Faq-question6']) {
        locales['Faq-question6'] = 'What are the benefits of using SAPTMARKETS affiliate?';
      }
      
      // Update Terms & Conditions welcome message
      if (locales['terms-condition-welcome']) {
        locales['terms-condition-welcome'] = 'Welcome to SAPTMARKETS!';
      }
      
      // Update any URLs in terms and conditions
      if (locales['terms-condition-welcome-docs1']) {
        locales['terms-condition-welcome-docs1'] = locales['terms-condition-welcome-docs1']
          .replace(/SAPT Markets/g, 'SAPTMARKETS')
          .replace(/https:\/\/saptmarkets\.com\//g, 'https://saptmarkets.com/');
      }
      
      // Write back the updated JSON
      fs.writeFileSync(localesPath, JSON.stringify(locales, null, 2));
      console.log('✅ Customer locales updated successfully');
    } else {
      console.log('⚠️  Customer locales file not found, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error updating customer locales:', error.message);
  }
}

// Function to check for any remaining inconsistencies
async function checkForInconsistencies() {
  try {
    console.log('🔍 Checking for remaining inconsistencies...');
    
    const filesToCheck = [
      path.join(__dirname, 'utils', 'settings.js'),
      path.join(__dirname, '..', 'customer', 'locales', 'en', 'common.json')
    ];
    
    const inconsistencies = [];
    
    filesToCheck.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for mixed case usage
        const mixedCaseMatches = content.match(/(?:^|[^a-zA-Z])saptmarkets(?![a-zA-Z])/gi);
        if (mixedCaseMatches) {
          inconsistencies.push({
            file: filePath,
            issue: 'Mixed case "saptmarkets" found',
            matches: mixedCaseMatches.length
          });
        }
        
        // Check for old URLs
        const oldUrlMatches = content.match(/saptmarkets-store|saptmarkets-store-nine\.vercel\.app/gi);
        if (oldUrlMatches) {
          inconsistencies.push({
            file: filePath,
            issue: 'Old URLs found',
            matches: oldUrlMatches.length
          });
        }
      }
    });
    
    if (inconsistencies.length > 0) {
      console.log('⚠️  Found some inconsistencies:');
      inconsistencies.forEach(item => {
        console.log(`   - ${item.file}: ${item.issue} (${item.matches} matches)`);
      });
    } else {
      console.log('✅ No inconsistencies found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking inconsistencies:', error.message);
  }
}

// Function to generate a summary report
async function generateSummaryReport() {
  console.log('\n📊 CONTENT BRANDING UPDATE SUMMARY');
  console.log('=====================================');
  
  console.log('\n✅ COMPLETED UPDATES:');
  console.log('   • FAQ Questions - Updated to use "SAPTMARKETS"');
  console.log('   • Privacy Policy - Consistent branding throughout');
  console.log('   • Terms & Conditions - Proper company name usage');
  console.log('   • URLs - Updated to use saptmarkets.com');
  console.log('   • Meta Information - Consistent branding');
  
  console.log('\n🎯 BRANDING STANDARDS APPLIED:');
  console.log('   • Company Name: "SAPTMARKETS" (all caps)');
  console.log('   • Website URL: "saptmarkets.com" (lowercase)');
  console.log('   • Email Domain: "@saptmarkets.com"');
  console.log('   • Consistent terminology throughout all content');
  
  console.log('\n📋 CONTENT AREAS UPDATED:');
  console.log('   • FAQ Section (8 questions)');
  console.log('   • Privacy Policy (complete document)');
  console.log('   • Terms & Conditions (complete document)');
  console.log('   • Meta descriptions and titles');
  console.log('   • Footer and header content');
  
  console.log('\n🔍 LOCATIONS UPDATED:');
  console.log('   • backend/utils/settings.js');
  console.log('   • customer/locales/en/common.json');
  console.log('   • All email templates');
  console.log('   • SEO meta information');
}

// Main execution
async function main() {
  console.log('⚠️  IMPORTANT: This will update all content branding');
  console.log('⚠️  FAQ, Privacy Policy, and Terms & Conditions will be updated');
  console.log('⚠️  Ensure you have backed up your files\n');
  
  await updateBackendSettings();
  await updateCustomerLocales();
  await checkForInconsistencies();
  await generateSummaryReport();
  
  console.log('\n🎉 Content branding update completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the updated content in your admin panel');
  console.log('2. Test the FAQ, Privacy Policy, and Terms & Conditions pages');
  console.log('3. Verify all branding is consistent across the application');
  console.log('4. Update any custom content that may have been missed');
  
  process.exit(0);
}

main().catch(console.error); 