const mongoose = require('mongoose');
const express = require('express');
const productUnitController = require('./controller/productUnitController');

// Load models
require('./models/ProductUnit');
require('./models/Unit');
require('./models/Product');

async function testActualAPI() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/saptmarkets?authSource=admin', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('🔗 Connected to MongoDB');
    
    // Create mock request and response objects
    const mockReq = {
      params: {
        productId: '6839d6bffbe2523a3073f970'
      }
    };
    
    const mockRes = {
      status: function(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json: function(data) {
        console.log('🎯 API RESPONSE STATUS:', this.statusCode);
        console.log('🎯 API RESPONSE DATA:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
          console.log('\n📊 ANALYZING FIRST PRODUCT UNIT:');
          const firstUnit = data.data[0];
          if (firstUnit) {
            console.log('Unit object type:', typeof firstUnit.unit);
            console.log('Unit has name:', firstUnit.unit && 'name' in firstUnit.unit);
            console.log('Unit name value:', firstUnit.unit?.name);
            console.log('UnitId value:', firstUnit.unitId);
            console.log('UnitName virtual:', firstUnit.unitName);
            console.log('DisplayName virtual:', firstUnit.displayName);
          }
        }
      }
    };
    
    // Call the actual controller function
    console.log('📞 Calling productUnitController.getProductUnits...');
    await productUnitController.getProductUnits(mockReq, mockRes);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testActualAPI(); 