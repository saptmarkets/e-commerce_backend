// Test script to verify bilingual AboutUs data handling
const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Adjust port if needed

// Test data structure that matches the new bilingual fields
const testBilingualData = {
  about_us: {
    title: {
      en: "About Us",
      ar: "معلومات عنا"
    },
    hero_description: {
      en: "Learn more about SAPT Markets and our story...",
      ar: "تعرف على المزيد عن أسواق سابت وقصتنا..."
    },
    top_section_title: {
      en: "A Trusted Name in Qassim Retail",
      ar: "اسم موثوق في تجارة القصيم"
    },
    top_section_description: {
      en: "At SAPT Markets, we've built our reputation on providing quality products and exceptional service to our community.",
      ar: "في أسواق سابت، بنينا سمعتنا على تقديم منتجات عالية الجودة وخدمة استثنائية لمجتمعنا."
    },
    trusted_badge_one_pill: {
      en: "Since 1989",
      ar: "منذ 1989"
    },
    trusted_badge_one_text: {
      en: "From Family Business",
      ar: "من عمل عائلي"
    },
    trusted_badge_two_pill: {
      en: "35+ Years",
      ar: "35+ سنة"
    },
    trusted_badge_two_text: {
      en: "Serving the Community",
      ar: "خدمة المجتمع"
    }
  }
};

async function testBilingualAboutUs() {
  try {
    console.log('🧪 Testing Bilingual AboutUs Backend Integration...\n');

    // Test 1: Update with bilingual data
    console.log('📝 Test 1: Updating with bilingual data...');
    const updateResponse = await axios.post(`${BASE_URL}/setting/store/customization/update`, {
      setting: testBilingualData
    });
    console.log('✅ Update successful:', updateResponse.data.message);

    // Test 2: Fetch the data back
    console.log('\n📖 Test 2: Fetching data back...');
    const fetchResponse = await axios.get(`${BASE_URL}/setting/store/customization/all`);
    const fetchedData = fetchResponse.data;
    
    console.log('✅ Fetch successful');
    console.log('🔍 About Us data structure:');
    console.log(JSON.stringify(fetchedData.about_us, null, 2));

    // Test 3: Verify specific fields
    console.log('\n🔍 Test 3: Verifying specific fields...');
    const aboutUs = fetchedData.about_us;
    
    if (aboutUs.title?.en && aboutUs.title?.ar) {
      console.log('✅ Title: Both English and Arabic present');
    } else {
      console.log('❌ Title: Missing one or both languages');
    }

    if (aboutUs.hero_description?.en && aboutUs.hero_description?.ar) {
      console.log('✅ Hero Description: Both English and Arabic present');
    } else {
      console.log('❌ Hero Description: Missing one or both languages');
    }

    if (aboutUs.top_section_title?.en && aboutUs.top_section_title?.ar) {
      console.log('✅ Top Section Title: Both English and Arabic present');
    } else {
      console.log('❌ Top Section Title: Missing one or both languages');
    }

    if (aboutUs.trusted_badge_one_pill?.en && aboutUs.trusted_badge_one_pill?.ar) {
      console.log('✅ Trusted Badge 1 Pill: Both English and Arabic present');
    } else {
      console.log('❌ Trusted Badge 1 Pill: Missing one or both languages');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testBilingualAboutUs(); 