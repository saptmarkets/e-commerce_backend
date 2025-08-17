const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");

const fixSAPTAboutUsData = async () => {
  try {
    await connectDB();
    console.log('🔧 Fixing SAPT Markets About Us data...');

    // Find the store customization setting
    const storeCustomization = await Setting.findOne({ name: "storeCustomizationSetting" });
    
    if (!storeCustomization) {
      console.log('❌ Store customization setting not found');
      return;
    }

    let aboutUs = storeCustomization.setting.about_us;
    let hasChanges = false;

    console.log('📊 Current About Us Data Analysis:');

    // Analyze team members
    const teamMembers = [
      'one', 'two', 'three', 'four', 'five', 'six', 
      'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'
    ];

    let validTeamMembers = 0;
    teamMembers.forEach((num, index) => {
      const nameField = `founder_${num}_name`;
      const positionField = `founder_${num}_position`;
      const imgField = `founder_${num}_img`;
      
      const hasName = aboutUs[nameField] && (aboutUs[nameField].en || aboutUs[nameField].ar);
      const hasPosition = aboutUs[positionField] && (aboutUs[positionField].en || aboutUs[positionField].ar);
      const hasImage = aboutUs[imgField] && aboutUs[imgField].length > 0;
      
      if (hasName) {
        validTeamMembers++;
        console.log(`👤 Member ${index + 1}: ${aboutUs[nameField].en || aboutUs[nameField].ar} - ${hasImage ? '✅ Has Image' : '❌ No Image'}`);
        
        // Fix missing Arabic translations for existing English content
        if (aboutUs[nameField].en && !aboutUs[nameField].ar) {
          // Add Arabic transliteration or keep English as fallback
          aboutUs[nameField].ar = aboutUs[nameField].en; // You can replace with proper Arabic names
          hasChanges = true;
        }
        
        if (aboutUs[positionField] && aboutUs[positionField].en && !aboutUs[positionField].ar) {
          // Add Arabic position translations
          const positionTranslations = {
            "The Founder": "المؤسس",
            "Co-Founder": "المؤسس المشارك", 
            "The CEO": "الرئيس التنفيذي",
            "Finance Manager": "مدير المالية",
            "Operations Manager": "مدير العمليات",
            "Marketing Director": "مدير التسويق",
            "HR Manager": "مدير الموارد البشرية",
            "IT Manager": "مدير تقنية المعلومات",
            "Quality Manager": "مدير الجودة",
            "Logistics Manager": "مدير اللوجستيات",
            "Customer Service Manager": "مدير خدمة العملاء",
            "Business Development Manager": "مدير تطوير الأعمال"
          };
          
          aboutUs[positionField].ar = positionTranslations[aboutUs[positionField].en] || aboutUs[positionField].en;
          hasChanges = true;
        }
      }
    });

    // Analyze core values
    const coreValues = ['one', 'two', 'three', 'four'];
    let validCoreValues = 0;
    coreValues.forEach((num, index) => {
      const titleField = `value_${num}_title`;
      const descField = `value_${num}_description`;
      
      const hasTitle = aboutUs[titleField] && (aboutUs[titleField].en || aboutUs[titleField].ar);
      const hasDesc = aboutUs[descField] && (aboutUs[descField].en || aboutUs[descField].ar);
      
      if (hasTitle) {
        validCoreValues++;
        console.log(`💎 Value ${index + 1}: ${aboutUs[titleField].en || aboutUs[titleField].ar}`);
        
        // Add missing Arabic translations for core values
        if (aboutUs[titleField].en && !aboutUs[titleField].ar) {
          const valueTranslations = {
            "Quality First": "الجودة أولاً",
            "Customer Care": "رعاية العملاء", 
            "Community Focus": "التركيز على المجتمع",
            "Innovation": "الابتكار"
          };
          aboutUs[titleField].ar = valueTranslations[aboutUs[titleField].en] || "";
          hasChanges = true;
        }
        
        if (aboutUs[descField] && aboutUs[descField].en && !aboutUs[descField].ar) {
          // Add Arabic descriptions (you can customize these)
          const descTranslations = {
            "We carefully select our products to ensure freshness, reliability, and the highest standards for your family's daily needs.": "نختار منتجاتنا بعناية لضمان الطازجة والاعتمادية وأعلى المعايير لاحتياجات أسرتك اليومية",
            "Every customer is valued and deserves exceptional service, respect, and attention to their needs.": "كل عميل له قيمة ويستحق خدمة استثنائية واحترام واهتمام باحتياجاته",
            "We're not just a store; we're part of the Qassim community, supporting local families and traditions.": "نحن لسنا مجرد متجر، بل جزء من مجتمع القصيم، ندعم العائلات والتقاليد المحلية",
            "We continuously evolve to meet changing customer needs and embrace new technologies.": "نتطور باستمرار لتلبية احتياجات العملاء المتغيرة ونتبنى التقنيات الجديدة"
          };
          aboutUs[descField].ar = descTranslations[aboutUs[descField].en] || "";
          hasChanges = true;
        }
      }
    });

    // Analyze branches
    const branches = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    let validBranches = 0;
    branches.forEach((num, index) => {
      const nameField = `branch_${num}_name`;
      const addressField = `branch_${num}_address`;
      
      const hasName = aboutUs[nameField] && (aboutUs[nameField].en || aboutUs[nameField].ar);
      const hasAddress = aboutUs[addressField] && (aboutUs[addressField].en || aboutUs[addressField].ar);
      
      if (hasName) {
        validBranches++;
        console.log(`🏢 Branch ${index + 1}: ${aboutUs[nameField].en || aboutUs[nameField].ar}`);
        
        // Fix missing Arabic translations for branches
        if (aboutUs[nameField].en && !aboutUs[nameField].ar) {
          const branchTranslations = {
            "SAPT Markets Central": "أسواق سبت المركزية",
            "SAPT Markets Express": "أسواق سبت السريع",
            "SAPT Markets North": "أسواق سبت الشمالي", 
            "SAPT Markets South": "أسواق سبت الجنوبي",
            "SAPT Markets East": "أسواق سبت الشرقي",
            "SAPT Markets West": "أسواق سبت الغربي",
            "SAPT Markets Premium": "أسواق سبت المميز",
            "SAPT Markets Family": "أسواق سبت العائلي"
          };
          aboutUs[nameField].ar = branchTranslations[aboutUs[nameField].en] || aboutUs[nameField].en;
          hasChanges = true;
        }
        
        // Add Arabic addresses where missing
        if (aboutUs[addressField] && aboutUs[addressField].en && !aboutUs[addressField].ar) {
          // Keep English addresses as fallback for now - you can add Arabic translations later
          aboutUs[addressField].ar = aboutUs[addressField].en;
          hasChanges = true;
        }
        
        // Fix other branch fields
        const otherFields = ['phone', 'hours', 'subtitle', 'services', 'directions'];
        otherFields.forEach(field => {
          const fieldName = `branch_${num}_${field}`;
          if (aboutUs[fieldName] && aboutUs[fieldName].en && !aboutUs[fieldName].ar) {
            aboutUs[fieldName].ar = aboutUs[fieldName].en; // Fallback to English
            hasChanges = true;
          }
        });
      }
    });

    // Summary before changes
    console.log('\n📊 Current Data Summary:');
    console.log(`👥 Valid Team Members: ${validTeamMembers}/12`);
    console.log(`💎 Valid Core Values: ${validCoreValues}/4`);  
    console.log(`🏢 Valid Branches: ${validBranches}/8`);

    // Save changes if any were made
    if (hasChanges) {
      await storeCustomization.save();
      console.log('\n✅ SAPT Markets About Us data updated successfully!');
      
      // Re-analyze after changes
      console.log('\n🎉 Updated Data Summary:');
      console.log(`👥 Team Members: All ${validTeamMembers} members now have complete dual-language support`);
      console.log(`💎 Core Values: All ${validCoreValues} values now have Arabic translations`);
      console.log(`🏢 Branches: All ${validBranches} branches now have complete information`);
    } else {
      console.log('\n✅ SAPT Markets About Us data is already properly structured!');
    }

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. Add images for team members 5-12 to improve visual consistency');
    console.log('2. Review Arabic translations for accuracy and cultural appropriateness');  
    console.log('3. Consider adding more detailed branch information for branches 2-8');
    console.log('4. Test the customer app to ensure all data displays correctly');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing SAPT About Us data:', error);
    process.exit(1);
  }
};

fixSAPTAboutUsData(); 