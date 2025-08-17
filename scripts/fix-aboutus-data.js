const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");

const fixAboutUsData = async () => {
  try {
    await connectDB();
    console.log('🔧 Starting About Us data validation and fix...');

    // Find the store customization setting
    const storeCustomization = await Setting.findOne({ name: "storeCustomizationSetting" });
    
    if (!storeCustomization) {
      console.log('❌ Store customization setting not found');
      return;
    }

    let aboutUs = storeCustomization.setting.about_us || {};
    let hasChanges = false;

    // Function to ensure proper language structure
    const ensureLanguageStructure = (value, defaultEn = "", defaultAr = "") => {
      if (!value) {
        return { en: defaultEn, ar: defaultAr };
      }
      
      if (typeof value === 'string') {
        // Convert string to language object
        return { en: value, ar: defaultAr };
      }
      
      if (typeof value === 'object' && (value.en || value.ar)) {
        // Already in correct format, ensure both languages exist
        return {
          en: value.en || defaultEn,
          ar: value.ar || defaultAr
        };
      }
      
      // Fallback
      return { en: defaultEn, ar: defaultAr };
    };

    // Fix team members (founders) data structure
    const teamMemberFields = [
      'one', 'two', 'three', 'four', 'five', 'six', 
      'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'
    ];

    console.log('🔧 Fixing team member data structures...');
    teamMemberFields.forEach(number => {
      const nameField = `founder_${number}_name`;
      const positionField = `founder_${number}_position`;
      
      if (aboutUs[nameField]) {
        const oldName = aboutUs[nameField];
        aboutUs[nameField] = ensureLanguageStructure(oldName);
        if (JSON.stringify(oldName) !== JSON.stringify(aboutUs[nameField])) {
          hasChanges = true;
          console.log(`✅ Fixed ${nameField}: ${JSON.stringify(oldName)} -> ${JSON.stringify(aboutUs[nameField])}`);
        }
      }
      
      if (aboutUs[positionField]) {
        const oldPosition = aboutUs[positionField];
        aboutUs[positionField] = ensureLanguageStructure(oldPosition);
        if (JSON.stringify(oldPosition) !== JSON.stringify(aboutUs[positionField])) {
          hasChanges = true;
          console.log(`✅ Fixed ${positionField}: ${JSON.stringify(oldPosition)} -> ${JSON.stringify(aboutUs[positionField])}`);
        }
      }
    });

    // Fix core values data structure
    console.log('🔧 Fixing core values data structures...');
    const coreValueFields = ['one', 'two', 'three', 'four'];
    coreValueFields.forEach(number => {
      const titleField = `value_${number}_title`;
      const descField = `value_${number}_description`;
      
      if (aboutUs[titleField]) {
        const oldTitle = aboutUs[titleField];
        aboutUs[titleField] = ensureLanguageStructure(oldTitle);
        if (JSON.stringify(oldTitle) !== JSON.stringify(aboutUs[titleField])) {
          hasChanges = true;
          console.log(`✅ Fixed ${titleField}`);
        }
      }
      
      if (aboutUs[descField]) {
        const oldDesc = aboutUs[descField];
        aboutUs[descField] = ensureLanguageStructure(oldDesc);
        if (JSON.stringify(oldDesc) !== JSON.stringify(aboutUs[descField])) {
          hasChanges = true;
          console.log(`✅ Fixed ${descField}`);
        }
      }
    });

    // Fix branches data structure
    console.log('🔧 Fixing branches data structures...');
    const branchFields = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    branchFields.forEach(number => {
      const nameField = `branch_${number}_name`;
      const addressField = `branch_${number}_address`;
      const hoursField = `branch_${number}_hours`;
      const phoneField = `branch_${number}_phone`;
      
      [nameField, addressField, hoursField, phoneField].forEach(field => {
        if (aboutUs[field]) {
          const oldValue = aboutUs[field];
          aboutUs[field] = ensureLanguageStructure(oldValue);
          if (JSON.stringify(oldValue) !== JSON.stringify(aboutUs[field])) {
            hasChanges = true;
            console.log(`✅ Fixed ${field}`);
          }
        }
      });
    });

    // Fix other common fields
    const commonFields = [
      'title', 'team_title', 'team_description', 'values_title', 'values_description',
      'branches_title', 'branches_description', 'top_section_title', 'top_section_description',
      'heritage_title', 'heritage_description_one', 'heritage_description_two'
    ];

    console.log('🔧 Fixing common fields data structures...');
    commonFields.forEach(field => {
      if (aboutUs[field]) {
        const oldValue = aboutUs[field];
        aboutUs[field] = ensureLanguageStructure(oldValue);
        if (JSON.stringify(oldValue) !== JSON.stringify(aboutUs[field])) {
          hasChanges = true;
          console.log(`✅ Fixed ${field}`);
        }
      }
    });

    // Save changes if any were made
    if (hasChanges) {
      storeCustomization.setting.about_us = aboutUs;
      await storeCustomization.save();
      console.log('✅ About Us data structure fixed and saved!');
    } else {
      console.log('✅ About Us data structure is already correct!');
    }

    // Validation summary
    const teamMembersCount = teamMemberFields.filter(num => 
      aboutUs[`founder_${num}_name`] && 
      (aboutUs[`founder_${num}_name`].en || aboutUs[`founder_${num}_name`].ar)
    ).length;

    const coreValuesCount = coreValueFields.filter(num => 
      aboutUs[`value_${num}_title`] && 
      (aboutUs[`value_${num}_title`].en || aboutUs[`value_${num}_title`].ar)
    ).length;

    const branchesCount = branchFields.filter(num => 
      aboutUs[`branch_${num}_name`] && 
      (aboutUs[`branch_${num}_name`].en || aboutUs[`branch_${num}_name`].ar)
    ).length;

    console.log('\n📊 About Us Data Summary:');
    console.log(`👥 Team Members: ${teamMembersCount}`);
    console.log(`💎 Core Values: ${coreValuesCount}`);
    console.log(`🏢 Branches: ${branchesCount}`);

    console.log('\n🎉 About Us data validation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing About Us data:', error);
    process.exit(1);
  }
};

fixAboutUsData(); 