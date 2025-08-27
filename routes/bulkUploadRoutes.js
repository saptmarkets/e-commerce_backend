const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Product = require('../models/Product');
const webScraperService = require('../services/webScraperService');

// Check MongoDB connection
router.get('/check-mongodb', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const isConnected = dbStatus === 1;
    
    console.log('=== MONGODB CONNECTION CHECK ===');
    console.log('Connection status:', dbStatus);
    console.log('Connection name:', mongoose.connection.name);
    console.log('Connection host:', mongoose.connection.host);
    console.log('Is connected:', isConnected);
    
    res.json({
      connected: isConnected,
      status: dbStatus,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      message: isConnected ? 'MongoDB connected successfully' : 'MongoDB not connected'
    });
  } catch (error) {
    console.error('MongoDB check error:', error);
    res.status(500).json({
      connected: false,
      error: error.message,
      message: 'Failed to check MongoDB connection'
    });
  }
});

// Check Cloudinary connection
router.get('/check-cloudinary', async (req, res) => {
  try {
    console.log('=== CLOUDINARY CONNECTION CHECK ===');
    
    // Test Cloudinary configuration
    const config = cloudinary.config();
    console.log('Cloudinary config:', {
      cloud_name: config.cloud_name,
      api_key: config.api_key ? '***' : 'not set',
      api_secret: config.api_secret ? '***' : 'not set'
    });
    
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return res.json({
        connected: false,
        message: 'Cloudinary configuration incomplete',
        config: {
          cloud_name: !!config.cloud_name,
          api_key: !!config.api_key,
          api_secret: !!config.api_secret
        }
      });
    }
    
    // Test upload with a small test image
    try {
      const testResult = await cloudinary.uploader.upload(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        {
          public_id: 'test-connection',
          overwrite: true,
          invalidate: true
        }
      );
      
      console.log('Cloudinary test upload successful');
      
      res.json({
        connected: true,
        message: 'Cloudinary connected successfully',
        test_upload: {
          public_id: testResult.public_id,
          url: testResult.secure_url
        }
      });
    } catch (uploadError) {
      console.error('Cloudinary test upload failed:', uploadError);
      res.json({
        connected: false,
        message: 'Cloudinary test upload failed',
        error: uploadError.message
      });
    }
  } catch (error) {
    console.error('Cloudinary check error:', error);
    res.status(500).json({
      connected: false,
      error: error.message,
      message: 'Failed to check Cloudinary connection'
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    const uploadDir = 'uploads/';
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
      if (err) {
        console.error('Error creating uploads directory:', err);
        cb(err);
      } else {
        cb(null, uploadDir);
      }
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Load images from directory
router.post('/load-images', async (req, res) => {
  try {
    const { directoryPath } = req.body;
    
    if (!directoryPath) {
      return res.status(400).json({ error: 'Directory path is required' });
    }

    // Check if directory exists
    try {
      await fs.access(directoryPath);
    } catch (error) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Read directory contents
    const files = await fs.readdir(directoryPath);
    const imageFiles = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          // Create a preview URL (you might want to serve this differently)
          const previewUrl = `/api/bulk-upload/preview/${encodeURIComponent(filePath)}`;
          
          imageFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            preview: previewUrl,
            lastModified: stats.mtime
          });
        }
      }
    }

    res.json({ 
      images: imageFiles,
      total: imageFiles.length
    });
  } catch (error) {
    console.error('Error loading images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get products without images
router.get('/products/without-images', async (req, res) => {
  try {
    console.log('=== BULK UPLOAD: Products without images request ===');
    
    // First check MongoDB connection
    const dbStatus = mongoose.connection.readyState;
    console.log('MongoDB connection status:', dbStatus);
    console.log('MongoDB connection name:', mongoose.connection.name);
    console.log('MongoDB connection host:', mongoose.connection.host);
    
    if (dbStatus !== 1) {
      console.log('❌ MongoDB not connected, status:', dbStatus);
      return res.status(500).json({ 
        error: 'MongoDB not connected',
        status: dbStatus,
        message: 'Database connection is not ready'
      });
    }

    console.log('✅ MongoDB connected successfully');

    // Check if Product model exists
    if (!Product) {
      console.log('❌ Product model not found');
      return res.status(500).json({ 
        error: 'Product model not available',
        message: 'Product model is not properly imported'
      });
    }

    console.log('✅ Product model found');

    // Get query parameters like the products page
    const { page = 1, limit = 50, title = '', category = '', searchType = 'all' } = req.query;
    const skip = (page - 1) * limit;

    console.log('Query parameters:', { page, limit, title, category, searchType });

    // Build query like the products page
    let queryObject = {};

    // Add search functionality like products page
    if (title) {
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchTerm = title.trim();
      
      const exactMatch = { $regex: `^${escapeRegExp(searchTerm)}$`, $options: 'i' };
      const startsWithMatch = { $regex: `^${escapeRegExp(searchTerm)}`, $options: 'i' };
      const containsMatch = { $regex: escapeRegExp(searchTerm), $options: 'i' };
      
      const words = searchTerm.split(/\s+/).filter(Boolean);
      const lookaheadPattern = words.map(w => `(?=.*${escapeRegExp(w)})`).join('');
      const multiWordMatch = { $regex: `${lookaheadPattern}.*`, $options: 'i' };

      if (searchType === 'barcode') {
        queryObject.$or = [
          { "barcode": exactMatch },
          { "barcode": startsWithMatch },
          { "barcode": containsMatch }
        ];
      } else if (searchType === 'sku') {
        queryObject.$or = [
          { "sku": exactMatch },
          { "sku": startsWithMatch },
          { "sku": containsMatch }
        ];
      } else {
        // Default search across multiple fields
        queryObject.$or = [
          { "title.en": containsMatch },
          { "title.ar": containsMatch },
          { "name": containsMatch },
          { "barcode": containsMatch },
          { "sku": containsMatch }
        ];
      }
    }

    // Add category filter
    if (category) {
      try {
        const categoryObjectId = new mongoose.Types.ObjectId(category);
        queryObject.category = categoryObjectId;
      } catch (error) {
        console.error("Error in category filter:", error);
      }
    }

    // Add the "no images" filter
    const noImagesFilter = {
      $or: [
        { image_url: { $exists: false } },
        { image_url: null },
        { image_url: '' },
        { image_url: { $regex: /^$/, $options: 'i' } },
        { image: { $exists: false } },
        { image: null },
        { image: '' },
        { image: { $regex: /^$/, $options: 'i' } },
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } }
      ]
    };

    // Combine the search query with the no images filter
    if (queryObject.$or) {
      queryObject = {
        $and: [queryObject, noImagesFilter]
      };
    } else {
      queryObject = noImagesFilter;
    }

    console.log('Final query object:', JSON.stringify(queryObject, null, 2));

    // Execute the query
    const products = await Product.find(queryObject)
      .select('_id title name company size description image_url image images category')
      .populate('category', 'name')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(queryObject);

    console.log('Products without images found:', products.length);
    console.log('Total count:', total);

    res.json({ 
      products: products,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      dbStatus: dbStatus,
      debug: {
        connectionStatus: dbStatus,
        connectionName: mongoose.connection.name,
        connectionHost: mongoose.connection.host,
        productModelExists: !!Product,
        queryObject: queryObject
      }
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      debug: {
        connectionStatus: mongoose.connection.readyState,
        connectionName: mongoose.connection.name,
        connectionHost: mongoose.connection.host
      }
    });
  }
});

// Match images with products
router.post('/match', async (req, res) => {
  try {
    const { images, products, settings } = req.body;
    
    if (!images || !products) {
      return res.status(400).json({ error: 'Images and products are required' });
    }

    const matches = [];
    
    for (const image of images) {
      const imageKeywords = extractKeywords(image.name);
      const bestMatch = findBestMatch(imageKeywords, products, settings);
      
      matches.push({
        imageName: image.name,
        imagePath: image.path,
        imagePreview: image.preview,
        productId: bestMatch?.product?.id || null,
        productName: bestMatch?.product?.name || null,
        confidence: bestMatch?.confidence || 0,
        alternatives: bestMatch?.alternatives || [],
        status: determineStatus(bestMatch?.confidence, settings?.confidenceThreshold || 70)
      });
    }

    res.json({ 
      matches: matches,
      total: matches.length,
      matched: matches.filter(m => m.status === 'matched').length
    });
  } catch (error) {
    console.error('Error matching images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload file to Cloudinary
router.post('/upload-file', upload.single('image'), async (req, res) => {
  try {
    console.log('=== BULK UPLOAD: File upload request ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
      console.error('❌ No file provided in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('✅ File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Cloudinary upload successful:', {
      url: result.secure_url,
      publicId: result.public_id
    });

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes
    });
  } catch (error) {
    console.error('❌ Error uploading file to Cloudinary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload image to Cloudinary by path
router.post('/upload-to-cloudinary', async (req, res) => {
  try {
    const { imagePath } = req.body;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product image in database
router.put('/products/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const product = await Product.findByIdAndUpdate(
      id, 
      { image_url },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ 
      success: true,
      product: {
        id: product._id,
        name: product.name,
        image_url: product.image_url
      }
    });
  } catch (error) {
    console.error('Error updating product image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check MongoDB connection
router.get('/check-mongodb', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusText = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      connected: dbStatus === 1,
      status: dbStatus,
      statusText: statusText[dbStatus],
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error) {
    console.error('MongoDB connection check error:', error);
    res.status(500).json({ 
      connected: false,
      error: error.message 
    });
  }
});

// Check Cloudinary connection
router.get('/check-cloudinary', async (req, res) => {
  try {
    // Test Cloudinary connection by getting account info
    const result = await cloudinary.api.ping();
    res.json({ 
      connected: true,
      account: result
    });
  } catch (error) {
    console.error('Cloudinary connection error:', error);
    res.status(500).json({ 
      connected: false,
      error: error.message 
    });
  }
});

// Bulk upload images
router.post('/bulk-upload', async (req, res) => {
  try {
    const { matches, settings } = req.body;
    
    if (!matches || !Array.isArray(matches)) {
      return res.status(400).json({ error: 'Matches array is required' });
    }

    const results = [];
    const batchSize = settings?.batchSize || 10;
    
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      for (const match of batch) {
        try {
          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(match.imagePath, {
            folder: 'products',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          });

          // Update database
          if (match.productId) {
            await Product.findByIdAndUpdate(match.productId, {
              image_url: uploadResult.secure_url
            });
          }

          results.push({
            ...match,
            status: 'success',
            cloudinaryUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
        } catch (error) {
          results.push({
            ...match,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: errorCount
      }
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function extractKeywords(filename) {
  const name = filename.toLowerCase();
  
  return {
    company: extractCompany(name),
    product: extractProduct(name),
    size: extractSize(name),
    arabicKeywords: extractArabicKeywords(name)
  };
}

function extractCompany(filename) {
  const companyPatterns = [
    /sapt/i,
    /شركة\s*سابت/i,
    /company/i,
    /شركة/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = filename.match(pattern);
    if (match) return match[0];
  }
  
  return '';
}

function extractProduct(filename) {
  let cleanName = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  cleanName = cleanName.replace(/[_-]/g, ' ');
  
  const companyKeywords = ['sapt', 'شركة', 'company', 'شركة سابت'];
  for (const keyword of companyKeywords) {
    cleanName = cleanName.replace(new RegExp(keyword, 'gi'), '');
  }
  
  return cleanName.trim();
}

function extractSize(filename) {
  const sizePatterns = [
    /(كبير|صغير|متوسط)/i,
    /(large|medium|small)/i,
    /(\d+)\s*(كجم|كيلو|kg|g)/i,
    /(\d+)\s*(لتر|liter|l)/i
  ];
  
  for (const pattern of sizePatterns) {
    const match = filename.match(pattern);
    if (match) return match[0];
  }
  
  return '';
}

function extractArabicKeywords(filename) {
  const arabicKeywords = [
    'منتج', 'سلعة', 'بضاعة', 'مادة', 'طعام', 'شراب',
    'لحم', 'خضار', 'فاكهة', 'حليب', 'جبن', 'خبز',
    'أرز', 'سكر', 'ملح', 'زيت', 'زبدة', 'عسل'
  ];
  
  const foundKeywords = [];
  for (const keyword of arabicKeywords) {
    if (filename.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  return foundKeywords;
}

function findBestMatch(imageKeywords, products, settings) {
  let bestMatch = null;
  let bestScore = 0;
  const alternatives = [];

  for (const product of products) {
    const score = calculateMatchScore(imageKeywords, product, settings);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { product, confidence: score };
    }
    
    if (score > (settings?.confidenceThreshold || 70) * 0.5) {
      alternatives.push({ product, confidence: score });
    }
  }

  return {
    ...bestMatch,
    alternatives: alternatives
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(alt => alt.product.name)
  };
}

function calculateMatchScore(imageKeywords, product, settings) {
  let totalScore = 0;
  let weightSum = 0;

  // Company matching (40% weight)
  if (settings?.enableEnglishMatching !== false) {
    const companyScore = fuzzyMatch(imageKeywords.company, product.company || '') * 0.4;
    totalScore += companyScore;
    weightSum += 0.4;
  }

  // Product name matching (40% weight)
  if (settings?.enableEnglishMatching !== false) {
    const productScore = fuzzyMatch(imageKeywords.product, product.name || '') * 0.4;
    totalScore += productScore;
    weightSum += 0.4;
  }

  // Arabic keyword matching (30% weight)
  if (settings?.enableArabicMatching !== false && imageKeywords.arabicKeywords.length > 0) {
    const arabicScore = calculateArabicScore(imageKeywords.arabicKeywords, product) * 0.3;
    totalScore += arabicScore;
    weightSum += 0.3;
  }

  // Size matching (20% weight)
  const sizeScore = fuzzyMatch(imageKeywords.size, product.size || '') * 0.2;
  totalScore += sizeScore;
  weightSum += 0.2;

  return Math.round((totalScore / weightSum) * 100);
}

function calculateArabicScore(arabicKeywords, product) {
  let maxScore = 0;
  
  for (const keyword of arabicKeywords) {
    const score = fuzzyMatch(keyword, product.name || '') || 
                 fuzzyMatch(keyword, product.company || '') ||
                 fuzzyMatch(keyword, product.description || '');
    maxScore = Math.max(maxScore, score);
  }
  
  return maxScore;
}

function fuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  return Math.max(0, 1 - (distance / maxLength));
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function determineStatus(confidence, threshold) {
  if (confidence >= threshold) return 'matched';
  if (confidence >= threshold * 0.7) return 'manual';
  return 'no_match';
}

// Fetch images from a website
router.post('/fetch-images-from-site', async (req, res) => {
  try {
    const { siteUrl, productNameEn, productNameAr } = req.body;
    
    console.log('=== FETCH IMAGES FROM SITE ===');
    console.log('Site URL:', siteUrl);
    console.log('Product Name (EN):', productNameEn);
    console.log('Product Name (AR):', productNameAr);
    
    if (!siteUrl || !productNameEn) {
      return res.status(400).json({
        success: false,
        error: 'Site URL and product name are required',
        message: 'Please provide both site URL and product name'
      });
    }
    
    // Use the web scraper service to fetch real images
    const images = await webScraperService.searchProduct(siteUrl, productNameEn);
    
    console.log(`Found ${images.length} images from ${siteUrl}`);
    
    res.json({
      success: true,
      images: images,
      message: `Found ${images.length} images for "${productNameEn}" from ${siteUrl}`
    });
  } catch (error) {
    console.error('Error fetching images from site:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch images from site'
    });
  }
});

// Fetch images from multiple sites for a product
router.post('/fetch-images-from-multiple-sites', async (req, res) => {
  try {
    const { siteUrls, productNameEn, productNameAr } = req.body;
    
    console.log('=== FETCH IMAGES FROM MULTIPLE SITES ===');
    console.log('Site URLs:', siteUrls);
    console.log('Product Name (EN):', productNameEn);
    console.log('Product Name (AR):', productNameAr);
    
    if (!siteUrls || !Array.isArray(siteUrls) || siteUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Site URLs array is required',
        message: 'Please provide an array of site URLs'
      });
    }
    
    if (!productNameEn) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required',
        message: 'Please provide product name'
      });
    }
    
    // Use the web scraper service to fetch images from all sites
    const allImages = await webScraperService.scrapeImagesFromSites(siteUrls, productNameEn);
    
    console.log(`Found images from ${Object.keys(allImages).length} sites`);
    
    res.json({
      success: true,
      images: allImages,
      message: `Found images from ${Object.keys(allImages).length} sites for "${productNameEn}"`
    });
  } catch (error) {
    console.error('Error fetching images from multiple sites:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch images from multiple sites'
    });
  }
});

// Upload image from URL to Cloudinary
router.post('/upload-from-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    console.log('=== UPLOAD IMAGE FROM URL ===');
    console.log('Image URL:', imageUrl);
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required',
        message: 'Please provide a valid image URL'
      });
    }
    
    // Upload to Cloudinary from URL
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'products',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    console.log('✅ Cloudinary upload from URL successful:', {
      url: result.secure_url,
      publicId: result.public_id
    });
    
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
      message: 'Image uploaded successfully from URL'
    });
  } catch (error) {
    console.error('❌ Error uploading image from URL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to upload image from URL'
    });
  }
});

module.exports = router; 