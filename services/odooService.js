const axios = require('axios');

class OdooService {
  constructor() {
    // Support both localhost and remote ngrok configurations
    if (process.env.ODOO_URL) {
      // Remote/ngrok setup
      this.baseUrl = process.env.ODOO_URL;
      console.log(`🌐 Using remote Odoo URL: ${this.baseUrl}`);
    } else {
      // Localhost setup
    this.host = process.env.ODOO_HOST || 'localhost';
    this.port = process.env.ODOO_PORT || '8069';
      this.baseUrl = `http://${this.host}:${this.port}`;
      console.log(`🏠 Using localhost Odoo: ${this.baseUrl}`);
    }
    
    // Database and credentials
    this.database = process.env.ODOO_DATABASE || process.env.ODOO_DB || 'forapi_17';
    this.username = process.env.ODOO_USERNAME || 'admin';
    this.password = process.env.ODOO_PASSWORD || 'admin';
    
    this.uid = null;
    this.isAuthenticated = false;
    
    // Enhanced timeout configuration for cloud-to-cloud communication
    this.axiosConfig = {
      timeout: 300000, // 5 minutes (increased from 10 minutes)
      headers: {
        'Content-Type': 'application/json',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    };

    // Retry configuration
    this.maxRetries = parseInt(process.env.ODOO_MAX_RETRIES) || 3;
    this.retryDelay = 2000; // 2 seconds initial delay
  }

  /**
   * Retry wrapper for API calls
   */
  async retryOperation(operation, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Authenticate with Odoo server
   */
  async authenticate() {
    return this.retryOperation(async () => {
    try {
      console.log(`🔐 Authenticating with Odoo at ${this.baseUrl}`);
      
      const response = await axios.post(`${this.baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [this.database, this.username, this.password, {}]
        }
      }, this.axiosConfig);

      if (response.data.error) {
        throw new Error(`Authentication failed: ${response.data.error.data?.message || 'Unknown error'}`);
      }

      if (response.data.result) {
        this.uid = response.data.result;
        this.isAuthenticated = true;
        console.log(`✅ Successfully authenticated with Odoo. UID: ${this.uid}`);
        return true;
      }

      throw new Error('Authentication failed: No UID received');
    } catch (error) {
      console.error('❌ Odoo authentication error:', error.message);
      this.isAuthenticated = false;
      throw error;
    }
    });
  }

  /**
   * Make a generic call to Odoo using XML-RPC with retry logic
   */
  async callOdoo(model, method, args = [], kwargs = {}) {
    return this.retryOperation(async () => {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    try {
      console.log(`\n🔄 Odoo RPC Call: ${model}.${method}`);
      console.log(`   Args:`, JSON.stringify(args, null, 2));
      console.log(`   Kwargs:`, JSON.stringify(kwargs, null, 2));

      const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [this.database, this.uid, this.password, model, method, args, kwargs]
        }
      };

      console.log(`📡 Sending request to ${this.baseUrl}/jsonrpc`);
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/jsonrpc`, payload, {
        ...this.axiosConfig,
        validateStatus: status => status < 500 // Accept any status < 500
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ RPC call took ${duration}ms`);

      if (response.data.error) {
        // Handle session expiry
        if (response.data.error.data?.name === 'SessionExpiredException') {
          console.log('🔄 Session expired, re-authenticating...');
          this.isAuthenticated = false;
          await this.authenticate();
            // Retry the call once after re-authentication
          return this.callOdoo(model, method, args, kwargs);
        }
        
          throw new Error(`Odoo RPC error: ${response.data.error.data?.message || response.data.error.message || 'Unknown error'}`);
        }

        console.log(`✅ RPC call successful`);
      return response.data.result;
    } catch (error) {
        console.error(`❌ Odoo RPC call failed: ${error.message}`);
      throw error;
    }
    });
  }

  /**
   * Search and read records from Odoo
   */
  async searchRead(model, domain = [], fields = [], offset = 0, limit = null, order = null) {
    // Ensure domain is properly formatted
    const safeDomain = Array.isArray(domain) ? domain : [];
    
    // Build kwargs with required fields
    const kwargs = { 
      fields,
      offset,
      order: order || 'id'
    };

    // Only add limit if specified
    if (limit !== null && limit > 0) {
      kwargs.limit = limit;
    }

    // ALWAYS include inactive/archived records as well
    kwargs.context = {
      ...(kwargs.context || {}),
      active_test: false,
    };

    console.log(`\n🔍 Executing search_read on ${model}`);
    console.log(`   Domain: ${JSON.stringify(safeDomain)}`);
    console.log(`   Fields: ${fields.length} fields requested`);
    console.log(`   Pagination: offset=${offset}, limit=${limit || 'unlimited'}`);

    const results = await this.callOdoo(model, 'search_read', [safeDomain], kwargs);
    
    if (!results) {
      console.warn(`⚠️ No results returned from ${model}.search_read`);
      return [];
    }

    return results;
  }

  /**
   * Count records matching domain
   */
  async searchCount(model, domain = []) {
    // Ensure domain is properly formatted
    const safeDomain = Array.isArray(domain) ? domain : [];
    
    console.log(`\n🔢 Counting ${model} records`);
    console.log(`   Domain: ${JSON.stringify(safeDomain)}`);
    
    // Include inactive records as well
    const kwargs = {
      context: {
        active_test: false,
      },
    };

    const count = await this.callOdoo(model, 'search_count', [safeDomain], kwargs);
    console.log(`   Found ${count} records`);
    
    return count;
  }

  /**
   * Read specific records by IDs
   */
  async read(model, ids, fields = []) {
    return await this.callOdoo(model, 'read', [ids, fields]);
  }

  /**
   * Create records in Odoo
   */
  async create(model, values) {
    return await this.callOdoo(model, 'create', [values]);
  }

  /**
   * Update records in Odoo
   */
  async write(model, ids, values) {
    return await this.callOdoo(model, 'write', [ids, values]);
  }

  /**
   * Delete records in Odoo
   */
  async unlink(model, ids) {
    return await this.callOdoo(model, 'unlink', [ids]);
  }

  /**
   * Test connection to Odoo
   */
  async testConnection() {
    try {
      await this.authenticate();
      
      // Try to fetch server version info
      const version = await axios.post(`${this.baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'version',
          args: []
        }
      }, this.axiosConfig);

      return {
        success: true,
        uid: this.uid,
        database: this.database,
        version: version.data.result,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Connection failed'
      };
    }
  }

  /**
   * Get Odoo server information
   */
  async getServerInfo() {
    try {
      const version = await axios.post(`${this.baseUrl}/jsonrpc`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'version',
          args: []
        }
      }, this.axiosConfig);

      return version.data.result;
    } catch (error) {
      throw new Error(`Failed to get server info: ${error.message}`);
    }
  }

  /**
   * Fetch products with comprehensive information
   */
  async fetchProducts(domain = [], limit = null, offset = 0) {
    console.log('\n📦 Fetching products from Odoo');
    console.log('Domain:', JSON.stringify(domain));
    
    // First get total count
    const totalCount = await this.searchCount('product.product', domain);
    console.log(`Total products matching domain: ${totalCount}`);
    
    const productFields = [
      'id', 'product_tmpl_id', 'name', 'default_code', 'barcode',
      'list_price', 'standard_price', 'qty_available', 'virtual_available',
      'categ_id', 'uom_id', 'uom_po_id', 'type', 'sale_ok', 'purchase_ok',
      'active', 'description_sale', 'weight', 'volume',
      'barcode_unit_ids', 'barcode_unit_count',
      'create_date', 'write_date'
    ];

    try {
      console.log(`🔄 Fetching products batch: offset=${offset}, limit=${limit || 'unlimited'}`);
      const products = await this.searchRead(
        'product.product',
        domain,
        productFields,
        offset,
        limit,
        'id'  // Sort by ID for consistent pagination
      );

      if (!products) {
        console.warn('⚠️ No products returned from Odoo');
        return [];
      }

      console.log(`📊 Processing ${products.length} products`);

      // Fetch product attributes for variants (in smaller chunks to avoid timeout)
      for (const product of products) {
        if (product.product_template_attribute_value_ids?.length > 0) {
          try {
            const attributes = await this.read(
              'product.template.attribute.value',
              product.product_template_attribute_value_ids,
              ['attribute_id', 'name']
            );
            
            product.attributes = attributes.map(attr => ({
              attribute_id: attr.attribute_id[0],
              attribute_name: attr.attribute_id[1],
              value: attr.name
            }));
          } catch (error) {
            console.warn(`Warning: Could not fetch attributes for product ${product.id}:`, error.message);
            product.attributes = [];
          }
        }
      }

      return products;
    } catch (error) {
      console.error(`❌ Error fetching products batch at offset ${offset}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch categories from Odoo
   */
  async fetchCategories(domain = [], limit = 1000, offset = 0) {
    try {
      console.log(`\n📂 Fetching categories from Odoo...`);
      console.log(`   Domain:`, JSON.stringify(domain, null, 2));
      console.log(`   Limit: ${limit}, Offset: ${offset}`);

      // Check if active field exists in product.category model
      const fieldsResponse = await this.callOdoo('product.category', 'fields_get', [], {
        attributes: ['string', 'type', 'required', 'readonly']
      });

      const hasActiveField = fieldsResponse && fieldsResponse.active;
      
      // Adjust domain based on field availability
      let adjustedDomain = domain;
      if (!hasActiveField && domain.some(condition => condition[0] === 'active')) {
        console.log('⚠️  Active field not available in product.category, removing active filter');
        adjustedDomain = domain.filter(condition => condition[0] !== 'active');
      }

      const categories = await this.searchRead(
      'product.category',
        adjustedDomain,
        ['id', 'name', 'complete_name', 'parent_id'],
        offset,
        limit
      );

      console.log(`✅ Successfully fetched ${categories.length} categories`);
      return categories;
    } catch (error) {
      console.error('❌ Error fetching categories:', error.message);
      throw error;
    }
  }

  /**
   * Fetch products by category ID
   */
  async fetchProductsByCategory(categoryId, limit = 500, offset = 0) {
    try {
      console.log(`\n📦 Fetching products for category ID: ${categoryId}`);
      console.log(`   Limit: ${limit}, Offset: ${offset}`);

      const domain = [['categ_id', '=', categoryId], ['active', '=', true]];
      
      const products = await this.searchRead(
        'product.product',
      domain,
        [
          'id', 'name', 'default_code', 'barcode', 
          'list_price', 'standard_price', 'lst_price',
          'price', 'pricelist_price', 'pricelist_ids',
          'categ_id', 'description', 'description_sale', 'image_1920',
          'product_template_attribute_value_ids', 'attribute_line_ids',
          'write_date', 'create_date', 'write_uid', 'create_uid'
        ],
      offset,
      limit,
        'write_date desc'  // Get most recently updated products first
      );

      console.log(`✅ Successfully fetched ${products.length} products for category ${categoryId}`);
      
      // Log price information for debugging
      if (products.length > 0) {
        console.log(`💰 Sample price data for first product:`);
        const sample = products[0];
        console.log(`   Product: ${sample.name}`);
        console.log(`   List Price: ${sample.list_price}`);
        console.log(`   Standard Price: ${sample.standard_price}`);
        console.log(`   LST Price: ${sample.lst_price}`);
        console.log(`   Price: ${sample.price}`);
        console.log(`   Last Updated: ${sample.write_date}`);
      }
      
      return products;
    } catch (error) {
      console.error(`❌ Error fetching products for category ${categoryId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch stock levels for products in a category
   */
  async fetchStockByCategory(categoryId, limit = 500, offset = 0) {
    try {
      console.log(`\n📊 Fetching stock levels for category ID: ${categoryId}`);
      console.log(`   Limit: ${limit}, Offset: ${offset}`);

      // First get products in the category
      const products = await this.fetchProductsByCategory(categoryId, limit, offset);
      
      if (products.length === 0) {
        console.log(`⚠️  No products found for category ${categoryId}`);
        return [];
      }

      const productIds = products.map(p => p.id);
      
      // Get stock levels for these products
      const stockDomain = [
        ['product_id', 'in', productIds],
        ['location_id.usage', '=', 'internal']
      ];

      const stockLevels = await this.searchRead(
        'stock.quant',
        stockDomain,
        ['product_id', 'location_id', 'quantity', 'reserved_quantity'],
        0,
        1000
      );

      console.log(`✅ Successfully fetched stock levels for ${stockLevels.length} product-location combinations`);
      return stockLevels;
    } catch (error) {
      console.error(`❌ Error fetching stock for category ${categoryId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync products by category with progress tracking
   */
  async syncProductsByCategory(categoryId, progressCallback = null) {
    try {
      console.log(`\n🔄 Starting sync for category ID: ${categoryId}`);
      
      // Get category info
      const categoryInfo = await this.searchRead(
        'product.category',
        [['id', '=', categoryId]],
        ['id', 'name', 'complete_name'],
        0,
        1
      );

      if (categoryInfo.length === 0) {
        throw new Error(`Category with ID ${categoryId} not found`);
      }

      const category = categoryInfo[0];
      console.log(`📂 Syncing category: ${category.complete_name}`);

      // 🚀 USE SAME METHOD AS FETCH DATA - but filtered by category
      const domain = [
        ['categ_id', '=', categoryId],
        ['active', '=', true]
      ];

      // Get total count first
      const totalCount = await this.searchCount('product.product', domain);
      console.log(`📊 Total products in category: ${totalCount}`);

      if (progressCallback) {
        progressCallback({
          category: category,
          total: totalCount,
          current: 0,
          status: 'starting'
        });
      }

      // Import required models for store sync
      const Product = require('../models/Product');
      const Category = require('../models/Category');
      const OdooProduct = require('../models/OdooProduct');
      const OdooPricelistItem = require('../models/OdooPricelistItem');
      const odooImportService = require('./odooImportService');

      // Ensure category exists in store
      let storeCategory = await Category.findOne({ odoo_id: category.id });
      if (!storeCategory) {
        console.log(`📂 Creating store category for: ${category.complete_name}`);
        storeCategory = await Category.create({
          name: { en: category.name, ar: category.name },
          slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          odoo_id: category.id,
          parent: null
        });
      }

      // 🔥 FIRST: Fetch products in batches using same comprehensive approach as fetchFromOdoo
      const batchSize = 100;
      let offset = 0;
      let syncedCount = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          console.log(`\n🔄 Fetching batch for category ${categoryId} (offset: ${offset})`);
          
          // Use same comprehensive field list as fetchFromOdoo
          const products = await this.searchRead(
            'product.product',
            domain,
            [
              'id', 'name', 'default_code', 'barcode', 
              'list_price', 'standard_price', 'lst_price',
              'price', 'pricelist_price', 'pricelist_ids',
              'categ_id', 'description', 'description_sale', 'image_1920',
              'product_template_attribute_value_ids', 'attribute_line_ids',
              'uom_id', 'uom_po_id', 'product_tmpl_id',
              'qty_available', 'virtual_available', 'barcode_unit_ids',
              'write_date', 'create_date', 'write_uid', 'create_uid'
            ],
            offset,
            batchSize,
            'write_date desc'  // Get most recently updated first
          );

          if (!products || products.length === 0) {
            console.log('✅ No more products to fetch');
            hasMore = false;
            break;
          }

          console.log(`📦 Processing ${products.length} products from Odoo...`);

          // 🔥 STEP 1: Store products in odoo_products collection (like fetch data does)
          const odooOperations = products.map(product => {
            // Extract IDs properly
            const categ_id = Array.isArray(product.categ_id) ? product.categ_id[0] : product.categ_id;
            const uom_id = Array.isArray(product.uom_id) ? product.uom_id[0] : product.uom_id;
            const product_tmpl_id = Array.isArray(product.product_tmpl_id) ? product.product_tmpl_id[0] : product.product_tmpl_id;

            const processedProduct = {
              id: product.id,
              name: product.name,
              default_code: product.default_code,
              barcode: product.barcode,
              list_price: product.list_price,
              standard_price: product.standard_price,
              lst_price: product.lst_price,
              price: product.price,
              categ_id: categ_id,
              uom_id: uom_id,
              product_tmpl_id: product_tmpl_id,
              qty_available: product.qty_available,
              virtual_available: product.virtual_available,
              barcode_unit_ids: product.barcode_unit_ids || [],
              write_date: product.write_date ? new Date(product.write_date) : new Date(),
              create_date: product.create_date ? new Date(product.create_date) : new Date(),
              _sync_status: 'pending',
              is_active: true,
            };

            return {
              updateOne: {
                filter: { id: product.id },
                update: { $set: processedProduct },
                upsert: true
              }
            };
          });

          // Write to odoo_products collection
          console.log('💾 Writing batch to odoo_products collection...');
          await OdooProduct.bulkWrite(odooOperations, { ordered: false });

          // 🔥 STEP 2: Fetch pricelist items for these specific products (like fetch data does)
          const productIds = products.map(p => p.id);
          console.log(`💰 Fetching pricelist items for ${productIds.length} products...`);
          
          // Fetch pricelist items for current products
          const pricelistItems = await this.fetchPricelistItems([
            ['product_id', 'in', productIds]
          ], 1000, 0);

          if (pricelistItems && pricelistItems.length > 0) {
            console.log(`📋 Found ${pricelistItems.length} pricelist items for current batch`);
            
            // Store pricelist items in database
            const pricelistOperations = pricelistItems.map(item => ({
              updateOne: {
                filter: { id: item.id },
                update: {
                  $set: {
                    id: item.id,
                    pricelist_id: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[0] : item.pricelist_id) : null,
                    pricelist_name: item.pricelist_id ? (Array.isArray(item.pricelist_id) ? item.pricelist_id[1] : null) : null,
                    product_tmpl_id: item.product_tmpl_id ? (Array.isArray(item.product_tmpl_id) ? item.product_tmpl_id[0] : item.product_tmpl_id) : null,
                    product_id: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[0] : item.product_id) : null,
                    product_name: item.product_id ? (Array.isArray(item.product_id) ? item.product_id[1] : null) : null,
                    applied_on: item.applied_on || '1_product',
                    compute_price: item.compute_price || 'fixed',
                    fixed_price: item.fixed_price,
                    price_discount: item.price_discount || 0,
                    min_quantity: item.min_quantity || 0,
                    date_start: item.date_start ? new Date(item.date_start) : null,
                    date_end: item.date_end ? new Date(item.date_end) : null,
                    create_date: item.create_date ? new Date(item.create_date) : new Date(),
                    write_date: item.write_date ? new Date(item.write_date) : new Date(),
                    _sync_status: 'pending',
                    is_active: true,
                  }
                },
                upsert: true
              }
            }));

            await OdooPricelistItem.bulkWrite(pricelistOperations, { ordered: false });
            console.log(`💾 Stored ${pricelistItems.length} pricelist items`);
          }

          // 🔥 STEP 3: Now sync to store database with proper price application
          console.log('🔄 Syncing batch to store database with pricelist pricing...');
          for (const product of products) {
            try {
              // Check if product already exists in store
              let storeProduct = await Product.findOne({ odoo_id: product.id });
              
              // 🔥 APPLY PRICELIST PRICING (like full fetch does)
              let finalPrice = product.list_price || product.lst_price || product.price || 0;
              let originalPrice = product.standard_price || product.list_price || 0;

              // Check for active pricelist items for this product
              const activeItems = await OdooPricelistItem.find({
                product_id: product.id,
                compute_price: 'fixed',
                $and: [
                  {
                    $or: [
                      { date_end: null },
                      { date_end: { $gte: new Date() } }
                    ]
                  },
                  {
                    $or: [
                      { date_start: null },
                      { date_start: { $lte: new Date() } }
                    ]
                  }
                ]
              }).sort({ write_date: -1 });

              if (activeItems.length > 0) {
                const bestPriceItem = activeItems[0];
                if (bestPriceItem.fixed_price !== null && bestPriceItem.fixed_price !== undefined) {
                  finalPrice = bestPriceItem.fixed_price;
                  console.log(`💰 Applied pricelist price for ${product.name}: ${finalPrice} (was: ${product.list_price})`);
                }
              }

              if (storeProduct) {
                // Update existing product with latest price data including pricelist pricing
                const updateData = {
                  title: { en: product.name, ar: product.name },
                  price: finalPrice,
                  originalPrice: originalPrice,
                  category: storeCategory._id,
                  categories: [storeCategory._id],
                  odoo_id: product.id,
                  write_date: product.write_date
                };

                await Product.findByIdAndUpdate(storeProduct._id, updateData);
                syncedCount++;
                
              } else {
                // Create new product with proper pricing
                const newProduct = await odooImportService.importProduct(product, storeCategory);
                if (newProduct) {
                  // Update with pricelist pricing if available
                  if (finalPrice !== (product.list_price || product.lst_price || product.price || 0)) {
                    await Product.findByIdAndUpdate(newProduct._id, { 
                      price: finalPrice,
                      originalPrice: originalPrice 
                    });
                  }
                  syncedCount++;
                }
              }

            } catch (productError) {
              console.error(`❌ Error syncing product ${product.id}:`, productError.message);
            }
          }

          offset += batchSize;

          if (progressCallback) {
            progressCallback({
              category: category,
              total: totalCount,
              current: offset,
              synced: syncedCount,
              status: 'syncing'
            });
          }

          console.log(`📦 Processed ${offset}/${totalCount} products, synced ${syncedCount} to store`);

        } catch (error) {
          console.error(`❌ Error processing batch:`, error.message);
          throw error;
        }
      }

      if (progressCallback) {
        progressCallback({
          category: category,
          total: totalCount,
          current: offset,
          synced: syncedCount,
          status: 'completed'
        });
      }

      console.log(`✅ Successfully synced ${syncedCount} products for category: ${category.complete_name}`);
      return {
        category: category,
        total: totalCount,
        synced: syncedCount
      };
    } catch (error) {
      console.error(`❌ Error syncing category ${categoryId}:`, error.message);
      
      if (progressCallback) {
        progressCallback({
          category: { id: categoryId, name: 'Unknown' },
          total: 0,
          current: 0,
          synced: 0,
          status: 'error',
          error: error.message
        });
      }
      
      throw error;
    }
  }

  /**
   * Sync a batch of products to store database
   */
  async syncBatchToStore(products, category) {
    try {
      console.log(`🔄 Syncing ${products.length} products to store database...`);
      
      // Import required models
      const Product = require('../models/Product');
      const Category = require('../models/Category');
      const odooImportService = require('./odooImportService');
      
      let syncedCount = 0;
      const errors = [];

      // First, ensure category exists in store
      let storeCategory = await Category.findOne({ odoo_id: category.id });
      if (!storeCategory) {
        console.log(`📂 Creating store category for: ${category.complete_name}`);
        storeCategory = await Category.create({
          name: { en: category.name, ar: category.name },
          slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          odoo_id: category.id,
          parent: null // You might want to handle parent categories
        });
      }

      // Process products in parallel batches
      const batchSize = 10;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (odooProduct) => {
          try {
            // Check if product already exists in store
            let storeProduct = await Product.findOne({ odoo_id: odooProduct.id });
            
            if (storeProduct) {
              // 🚀 UPDATE EXISTING PRODUCT WITH LATEST PRICE DATA
              const updateData = {
                title: { en: odooProduct.name, ar: odooProduct.name },
                price: odooProduct.list_price || odooProduct.lst_price || 0,
                originalPrice: odooProduct.standard_price || odooProduct.list_price || 0,
                category: storeCategory._id,
                categories: [storeCategory._id],
                odoo_id: odooProduct.id,
                write_date: odooProduct.write_date
              };

              // Use the most recent price data available
              if (odooProduct.price && odooProduct.price !== odooProduct.list_price) {
                updateData.price = odooProduct.price;
                console.log(`💰 Updated price for ${odooProduct.name}: ${odooProduct.price} (was: ${odooProduct.list_price})`);
              }

              await Product.findByIdAndUpdate(storeProduct._id, updateData);
              syncedCount++;
              
            } else {
              // Create new product
              const newProduct = await odooImportService.importProduct(odooProduct, storeCategory);
              if (newProduct) syncedCount++;
            }

          } catch (error) {
            console.error(`❌ Error syncing product ${odooProduct.id}:`, error.message);
            errors.push({
              product_id: odooProduct.id,
              error: error.message
            });
          }
        }));
      }

      console.log(`✅ Batch sync completed: ${syncedCount} products synced, ${errors.length} errors`);
      return { synced: syncedCount, errors };
      
    } catch (error) {
      console.error('❌ Error in batch sync:', error.message);
      throw error;
    }
  }

  /**
   * Get all categories for sync selection
   */
  async getCategoriesForSync() {
    try {
      console.log(`\n📂 Fetching categories for sync selection...`);

      const categories = await this.searchRead(
        'product.category',
        [], // No domain - get all categories
        ['id', 'name', 'complete_name', 'parent_id'],
        0,
        1000,
        'name asc'
      );

      // Add product count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          try {
            const count = await this.searchCount('product.product', [
              ['categ_id', '=', category.id],
              ['active', '=', true]
            ]);
            return {
              ...category,
              product_count: count
            };
          } catch (error) {
            console.log(`⚠️  Could not get count for category ${category.id}: ${error.message}`);
            return {
              ...category,
              product_count: 0
            };
          }
        })
      );

      console.log(`✅ Successfully fetched ${categoriesWithCount.length} categories with product counts`);
      return categoriesWithCount;
    } catch (error) {
      console.error('❌ Error fetching categories for sync:', error.message);
      throw error;
    }
  }

  /**
   * Fetch units of measure
   */
  async fetchUom(domain = [], limit = 1000, offset = 0) {
    const uomFields = [
      'id', 'name', 'category_id', 'factor', 'factor_inv',
      'uom_type', 'rounding', 'active',
      'create_date', 'write_date'
    ];

    return await this.searchRead(
      'uom.uom',
      domain,
      uomFields,
      offset,
      limit,
      'write_date desc'
    );
  }

  /**
   * Fetch pricelists
   */
  async fetchPricelists(domain = [], limit = 1000, offset = 0) {
    const pricelistFields = [
      'id', 'name', 'currency_id', 'company_id', 'discount_policy', 'active',
      'create_date', 'write_date'
    ];

    return await this.searchRead(
      'product.pricelist',
      domain,
      pricelistFields,
      offset,
      limit,
      'write_date desc'
    );
  }

  /**
   * Fetch pricelist items
   */
  async fetchPricelistItems(domain = [], limit = 1000, offset = 0) {
    const itemFields = [
      'id', 'pricelist_id', 'product_tmpl_id', 'product_id',
      'barcode_unit_id', 'applied_on', 'compute_price',
      'fixed_price', 'price_discount', 'price_surcharge',
      'price_round', 'price_min_margin', 'price_max_margin', 'percent_price',
      'min_quantity', 'max_quantity', 'date_start', 'date_end',
      'base_pricelist_id', 'base', 'company_id', 'currency_id',
      'create_date', 'write_date'
    ];

    return await this.searchRead(
      'product.pricelist.item',
      domain,
      itemFields,
      offset,
      limit,
      'write_date desc'
    );
  }

  /**
   * Fetch stock information
   */
  async fetchStock(domain = [], limit = 1000, offset = 0) {
    const stockFields = [
      'id', 'product_id', 'location_id', 'lot_id', 'package_id', 'owner_id',
      'quantity', 'reserved_quantity', 'available_quantity',
      'create_date', 'write_date'
    ];

    // Default domain to only fetch from internal and transit locations
    const defaultDomain = [['location_id.usage', 'in', ['internal', 'transit']]];
    const finalDomain = domain.length > 0 ? domain : defaultDomain;

    return await this.searchRead(
      'stock.quant',
      finalDomain,
      stockFields,
      offset,
      limit,
      'write_date desc'
    );
  }

  /**
   * Fetch barcode units
   */
  async fetchBarcodeUnits(domain = [], limit = 1000, offset = 0) {
    const unitFields = [
      'id', 'name', 'sequence', 'product_id', 'product_tmpl_id',
      'barcode', 'quantity', 'unit', 'price', 'av_cost',
      'purchase_qty', 'purchase_cost', 'sales_vat', 'sale_qty',
      'company_id', 'currency_id', 'active',
      'create_date', 'write_date'
    ];

    return await this.searchRead(
      'product.barcode.unit',
      domain,
      unitFields,
      offset,
      limit,
      'write_date desc'
    );
  }

  /**
   * Adjust Odoo stock by creating/applying an inventory adjustment on stock.quant.
   * This is the only RPC-safe method that works on Odoo 17 (public helpers were removed).
   *
   * @param {number} productId   Odoo product.product id in its base UoM
   * @param {number} locationId  Odoo stock.location id (must be internal or transit)
   * @param {number} delta       Signed quantity (negative to deduct, positive to add)
   */
  async updateStock(productId, locationId, delta) {
    if (!delta || delta === 0) {
      console.log('ℹ️  updateStock called with delta 0 – nothing to do');
      return { success: true };
    }

    try {
      // 1) Locate or create the quant
      const quants = await this.searchRead(
        'stock.quant',
        [
          ['product_id', '=', productId],
          ['location_id', '=', locationId],
        ],
        ['id'],
        0,
        1
      );

      let quantId;
      if (quants.length) {
        quantId = quants[0].id;
      } else {
        // No quant yet for this product/location → create an empty one
        quantId = await this.create('stock.quant', {
          product_id: productId,
          location_id: locationId,
          quantity: 0,
        });
      }

      // 2) Write the delta into inventory_diff_quantity (signed)
      await this.write('stock.quant', [quantId], {
        inventory_diff_quantity: delta,
      });

      // 3) Apply the inventory adjustment which posts the move
      await this.callOdoo('stock.quant', 'action_apply_inventory', [[quantId]]);

      console.log(`✔️  Stock updated (quant ${quantId}): product ${productId}, location ${locationId}, delta ${delta}`);
      return { success: true };
    } catch (err) {
      console.error(`❌ Failed to update stock for product ${productId}:`, err.message || err);
      throw err;
    }
  }

  /**
   * Create and validate a stock picking (inventory loss/internal transfer) in Odoo
   * @param {number} productId - Odoo product.product id
   * @param {number} sourceLocationId - Odoo source location id (e.g. warehouse)
   * @param {number} destinationLocationId - Odoo destination location id (e.g. e-commerce/inventory loss)
   * @param {number} qty - Quantity to move
   * @param {number} uomId - Odoo unit of measure id (optional, can be fetched if needed)
   * @param {number} pickingTypeId - Odoo picking type id (optional, can be fetched if needed)
   * @returns {Promise<object>} - Result of picking creation and validation
   */
  async createAndValidatePicking(productId, sourceLocationId, destinationLocationId, qty, uomId = null, pickingTypeId = null) {
    if (!productId || !sourceLocationId || !destinationLocationId || !qty) {
      throw new Error('Missing required parameters for picking');
    }
    
    console.log(`🔧 createAndValidatePicking called with:`, {
      productId, sourceLocationId, destinationLocationId, qty, uomId, pickingTypeId
    });
    
    // Try to fetch UoM if not provided
    if (!uomId) {
      console.log(`🔍 Fetching UoM for product ${productId}...`);
      const product = await this.read('product.product', [productId], ['uom_id']);
      uomId = Array.isArray(product) && product[0]?.uom_id ? (Array.isArray(product[0].uom_id) ? product[0].uom_id[0] : product[0].uom_id) : null;
      if (!uomId) throw new Error('Could not determine UoM for product ' + productId);
      console.log(`✅ Found UoM: ${uomId}`);
    }
    
    // Try to fetch picking type if not provided (default to first internal picking type)
    if (!pickingTypeId) {
      console.log(`🔍 Fetching picking type for internal transfers...`);
      const types = await this.searchRead('stock.picking.type', [['code', '=', 'internal']], ['id'], 0, 1);
      pickingTypeId = types.length ? types[0].id : null;
      if (!pickingTypeId) throw new Error('Could not determine picking type');
      console.log(`✅ Found picking type: ${pickingTypeId}`);
    }
    
    console.log(`🚀 Creating picking with:`, {
      picking_type_id: pickingTypeId,
      location_id: sourceLocationId,
      location_dest_id: destinationLocationId,
      move_ids_without_package: [{
        name: 'E-commerce sale',
        product_id: productId,
        product_uom_qty: Math.abs(qty),
        product_uom: uomId,
        location_id: sourceLocationId,
        location_dest_id: destinationLocationId,
      }]
    });
    
    // 1. Create picking
    const pickingId = await this.create('stock.picking', {
      picking_type_id: pickingTypeId,
      location_id: sourceLocationId,
      location_dest_id: destinationLocationId,
      move_ids_without_package: [
        [0, 0, {
          name: 'E-commerce sale',
          product_id: productId,
          product_uom_qty: Math.abs(qty),
          product_uom: uomId,
          location_id: sourceLocationId,
          location_dest_id: destinationLocationId,
        }]
      ]
    });
    
    console.log(`✅ Picking created with ID: ${pickingId}`);
    
    // 2. Confirm picking
    console.log(`🔄 Confirming picking ${pickingId}...`);
    await this.callOdoo('stock.picking', 'action_confirm', [[pickingId]]);
    console.log(`✅ Picking confirmed`);
    
    // 3. Validate picking
    console.log(`🔄 Validating picking ${pickingId}...`);
    await this.callOdoo('stock.picking', 'button_validate', [[pickingId]]);
    console.log(`✅ Picking validated`);
    
    return { success: true, pickingId };
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isAuthenticated,
      host: this.host,
      port: this.port,
      database: this.database,
      username: this.username,
      uid: this.uid,
    };
  }
}

module.exports = new OdooService(); 