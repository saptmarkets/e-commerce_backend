// Simple script to fix CORS configuration
const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend', 'start-server.js');

if (fs.existsSync(serverFile)) {
  let content = fs.readFileSync(serverFile, 'utf8');
  
  // Replace the old CORS configuration with the new one
  const oldCorsConfig = `// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:4100',
    'http://127.0.0.1:4100',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'company'],
  credentials: true,
  optionsSuccessStatus: 200
};`;

  const newCorsConfig = `// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get CORS origins from environment variable or use defaults
    const envCorsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
    
    const allowedOrigins = [
      'http://localhost:4100',
      'http://127.0.0.1:4100',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      // Add your deployed admin domain
      'https://e-commerce-admin-five-sable.vercel.app',
      // Allow any vercel.app domain for development
      /^https:\\/\\/.*\\.vercel\\.app$/,
      // Add environment variable origins
      ...envCorsOrigins
    ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'company'],
  credentials: true,
  optionsSuccessStatus: 200
};`;

  if (content.includes(oldCorsConfig)) {
    content = content.replace(oldCorsConfig, newCorsConfig);
    fs.writeFileSync(serverFile, content, 'utf8');
    console.log('✅ CORS configuration updated successfully!');
    console.log('🔄 Please restart your Render service to apply changes.');
  } else {
    console.log('⚠️  Old CORS configuration not found. File might already be updated.');
  }
} else {
  console.log('❌ start-server.js file not found at:', serverFile);
} 