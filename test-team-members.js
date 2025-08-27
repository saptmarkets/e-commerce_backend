const axios = require('axios');

const BASE_URL = 'http://localhost:5055'; // Backend runs on port 5055

async function testTeamMembersData() {
  try {
    console.log('🧪 Testing Team Members Data Flow...\n');

    // Test data for team members 2-6
    const testData = {
      name: "storeCustomizationSetting",
      setting: {
        about_us: {
          founder_two_name: {
            en: "Test Member Two EN",
            ar: "عضو تجريبي اثنان"
          },
          founder_two_position: {
            en: "Test Position Two EN",
            ar: "منصب تجريبي اثنان"
          },
          founder_three_name: {
            en: "Test Member Three EN",
            ar: "عضو تجريبي ثلاثة"
          },
          founder_three_position: {
            en: "Test Position Three EN",
            ar: "منصب تجريبي ثلاثة"
          },
          founder_four_name: {
            en: "Test Member Four EN",
            ar: "عضو تجريبي أربعة"
          },
          founder_four_position: {
            en: "Test Position Four EN",
            ar: "منصب تجريبي أربعة"
          },
          founder_five_name: {
            en: "Test Member Five EN",
            ar: "عضو تجريبي خمسة"
          },
          founder_five_position: {
            en: "Test Position Five EN",
            ar: "منصب تجريبي خمسة"
          },
          founder_six_name: {
            en: "Test Member Six EN",
            ar: "عضو تجريبي ستة"
          },
          founder_six_position: {
            en: "Test Position Six EN",
            ar: "منصب تجريبي ستة"
          }
        }
      }
    };

    console.log('📤 Sending test data to backend...');
    console.log('Test data structure:', JSON.stringify(testData, null, 2));

    // Send POST request to update the data
    const updateResponse = await axios.post(
      `${BASE_URL}/setting/store/customization/update`,
      testData
    );

    console.log('\n✅ Update response:', updateResponse.data.message);

    // Wait a moment for the update to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now fetch the data back to verify it was saved correctly
    console.log('\n📥 Fetching data back from backend...');
    const fetchResponse = await axios.get(
      `${BASE_URL}/setting/store/customization/all`
    );

    const fetchedData = fetchResponse.data;
    console.log('\n📊 Fetched data structure:');
    console.log('About Us section:', JSON.stringify(fetchedData.about_us, null, 2));

    // Verify the team members data
    console.log('\n🔍 Verifying team members data...');
    
    const teamMembers = [
      'founder_two', 'founder_three', 'founder_four', 'founder_five', 'founder_six'
    ];

    teamMembers.forEach(member => {
      const name = fetchedData.about_us[`${member}_name`];
      const position = fetchedData.about_us[`${member}_position`];
      
      console.log(`\n${member.toUpperCase()}:`);
      console.log(`  Name: ${JSON.stringify(name)}`);
      console.log(`  Position: ${JSON.stringify(position)}`);
      
      if (name && name.en && name.ar && position && position.en && position.ar) {
        console.log(`  ✅ ${member} data is complete and bilingual`);
      } else {
        console.log(`  ❌ ${member} data is incomplete or missing`);
      }
    });

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTeamMembersData(); 