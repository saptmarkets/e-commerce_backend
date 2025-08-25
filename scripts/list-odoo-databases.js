const axios = require('axios');

async function listOdooDatabases() {
  try {
    console.log('🔍 Listing available Odoo databases...');
    
    const baseUrl = 'http://localhost:8069';
    
    // Method 1: Try to get database list
    console.log('\n📋 Method 1: Getting database list...');
    try {
      const response = await axios.post(`${baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'db',
          method: 'list',
          args: []
        }
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.result) {
        console.log('✅ Available databases:', response.data.result);
      } else {
        console.log('❌ No databases found or method not supported');
      }
    } catch (error) {
      console.log('❌ Method 1 failed:', error.message);
    }
    
    // Method 2: Try to get database list with different service
    console.log('\n📋 Method 2: Trying common service...');
    try {
      const response = await axios.post(`${baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'list',
          args: []
        }
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.result) {
        console.log('✅ Available databases:', response.data.result);
      } else {
        console.log('❌ No databases found or method not supported');
      }
    } catch (error) {
      console.log('❌ Method 2 failed:', error.message);
    }
    
    // Method 3: Try to get database list with web service
    console.log('\n📋 Method 3: Trying web service...');
    try {
      const response = await axios.get(`${baseUrl}/web/database/selector`, {
        timeout: 10000
      });
      
      console.log('✅ Web response status:', response.status);
      console.log('✅ Web response headers:', response.headers);
      
      // Look for database names in the response
      const html = response.data;
      const dbMatches = html.match(/database_name["\s]*[:=]["\s]*([^"'\s]+)/g);
      if (dbMatches) {
        console.log('✅ Found database references:', dbMatches);
      }
      
    } catch (error) {
      console.log('❌ Method 3 failed:', error.message);
    }
    
    // Method 4: Try to get database list with xmlrpc
    console.log('\n📋 Method 4: Trying xmlrpc...');
    try {
      const response = await axios.post(`${baseUrl}/xmlrpc/2/common`, {
        method: 'list',
        params: []
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.result) {
        console.log('✅ Available databases:', response.data.result);
      } else {
        console.log('❌ No databases found or method not supported');
      }
    } catch (error) {
      console.log('❌ Method 4 failed:', error.message);
    }
    
    console.log('\n🎯 Database listing completed!');
    
  } catch (error) {
    console.error('❌ Error during database listing:', error.message);
  }
}

listOdooDatabases(); 