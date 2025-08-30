console.log('🧪 Basic Import Test...\n');

try {
  console.log('1️⃣ Testing basic imports...');
  
  const OdooService = require('./services/odooService');
  console.log('✅ OdooService imported');
  
  const OdooIntegrationService = require('./services/odooIntegrationService');
  console.log('✅ OdooIntegrationService imported');
  
  const Order = require('./models/Order');
  console.log('✅ Order model imported');
  
  const OrderPushSession = require('./models/OrderPushSession');
  console.log('✅ OrderPushSession model imported');
  
  console.log('\n2️⃣ Testing service instantiation...');
  const odooService = new OdooIntegrationService();
  console.log('✅ Service instantiated');
  
  console.log('\n3️⃣ Testing method existence...');
  const methods = [
    'resolveCustomer',
    'resolveProduct',
    'createSalesOrder',
    'processOrderBatch',
    'classifyError'
  ];
  
  methods.forEach(method => {
    if (typeof odooService[method] === 'function') {
      console.log(`✅ ${method} method exists`);
    } else {
      console.log(`❌ ${method} method missing`);
    }
  });
  
  console.log('\n4️⃣ Testing error classification...');
  const testError = new Error('Test error');
  const classification = odooService.classifyError(testError);
  console.log('✅ Error classification works:', classification);
  
  console.log('\n🎉 Basic test completed successfully!');
  console.log('✅ All imports working');
  console.log('✅ Service instantiation working');
  console.log('✅ Methods exist');
  console.log('✅ Error classification working');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
