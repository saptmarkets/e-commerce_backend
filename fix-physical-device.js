const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Metro bundler connection for physical device...\n');

// Step 1: Check if device is connected
console.log('1. Checking ADB connection...');
try {
  const devices = execSync('adb devices', { encoding: 'utf8' });
  console.log(devices);
  
  if (!devices.includes('device')) {
    console.log('❌ No device detected. Please:');
    console.log('   - Enable Developer Options on your phone');
    console.log('   - Enable USB Debugging');
    console.log('   - Connect via USB and accept the debugging prompt');
    console.log('   - Or connect via WiFi using: adb connect YOUR_PHONE_IP:5555');
    process.exit(1);
  }
  console.log('✅ Device connected\n');
} catch (error) {
  console.log('❌ ADB not working. Make sure Android SDK is installed.\n');
}

// Step 2: Set up port forwarding
console.log('2. Setting up port forwarding...');
try {
  execSync('adb reverse tcp:8081 tcp:8081', { encoding: 'utf8' });
  console.log('✅ Port 8081 forwarded\n');
} catch (error) {
  console.log('⚠️  Port forwarding failed, but continuing...\n');
}

// Step 3: Check metro config
console.log('3. Checking Metro configuration...');
const metroConfigPath = path.join(__dirname, 'metro.config.js');
if (!fs.existsSync(metroConfigPath)) {
  console.log('📝 Creating metro.config.js...');
  const metroConfig = `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 8081,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`;
  fs.writeFileSync(metroConfigPath, metroConfig);
  console.log('✅ Metro config created\n');
} else {
  console.log('✅ Metro config exists\n');
}

// Step 4: Update network security config
console.log('4. Checking network security config...');
const networkConfigPath = path.join(__dirname, 'android/app/src/main/res/xml/network_security_config.xml');
if (fs.existsSync(networkConfigPath)) {
  console.log('✅ Network security config exists\n');
} else {
  console.log('⚠️  Network security config missing\n');
}

// Step 5: Provide instructions
console.log('🚀 Next steps:');
console.log('1. Make sure your phone and computer are on the same WiFi network');
console.log('2. On your phone, go to Settings > Developer Options > USB Debugging (enable)');
console.log('3. If using WiFi debugging:');
console.log('   - Enable "Wireless debugging" in Developer Options');
console.log('   - Run: adb connect YOUR_PHONE_IP:5555');
console.log('4. Run: npm start -- --host 0.0.0.0');
console.log('5. Run: npm run android');
console.log('\n📱 If you still get the Metro error:');
console.log('   - Shake your phone to open dev menu');
console.log('   - Tap "Settings"');
console.log('   - Change "Debug server host & port" to: 192.168.0.113:8081');
console.log('   - Go back and tap "Reload"'); 