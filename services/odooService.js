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
          'list_price', 'standard_price', 'lst_price', 'cost',
          'price', 'pricelist_price', 'pricelist_ids',
          'categ_id', 'description', 'description_sale', 'image_1920',
          'product_template_attribute_value_ids', 'attribute_line_ids',
          'uom_id', 'uom_po_id', 'product_tmpl_id',
          'qty_available', 'virtual_available', 'barcode_unit_ids',  // ✅ Add stock fields
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
        console.log(`   Cost: ${sample.cost}`);
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
   * Sync products by category with batch fetching and stock sync - ODOO TABLES ONLY
   * Completely replaces products in odoo_* tables for the selected category
   * Includes stock data synchronization
   * Does NOT touch store database (preserves custom changes like images)
   * Use 'Sync to Store' function separately when ready to update store
   */
  async syncProductsByCategory(categoryId, progressCallback = null, batchConfig = {}) {
    try {
      console.log(`\n🔄 Starting batch sync for category ID: ${categoryId}`);
      
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

      // Use same domain as fetch products but filtered by category
      // CRITICAL: Odoo requires category ID to be a number, not string
      const numericCategoryId = parseInt(categoryId);
      if (isNaN(numericCategoryId)) {
        throw new Error(`Invalid category ID: ${categoryId} - must be a number`);
      }
      
      // For main categories, include all subcategories using 'child_of' operator
      // This ensures we sync ALL products under the main category hierarchy
      const domain = [
        ['categ_id', 'child_of', numericCategoryId], // Include main category + all subcategories
        ['active', '=', true]
      ];
      
      console.log(`🔍 Main category sync: Using 'child_of' operator to include all subcategories under category ${numericCategoryId}`);

      // Get total count first
      const totalCount = await this.searchCount('product.product', domain);
      console.log(`📊 Total products in category: ${totalCount}`);

      if (totalCount === 0) {
        console.log(`⚠️ No products found in category ${category.complete_name}`);
      if (progressCallback) {
        progressCallback({
          category: category,
            total: 0,
            current: 0,
            synced: 0,
            status: 'completed'
          });
        }
        return {
          category: category,
          total: 0,
          synced: 0
        };
      }

      // Apply batching configuration
      const { offset = 0, limit = null } = batchConfig;
      const effectiveStartOffset = offset || 0;
      const effectiveMaxLimit = limit || totalCount;
      const effectiveEndOffset = Math.min(effectiveStartOffset + effectiveMaxLimit, totalCount);

      console.log(`📊 Batching: Processing products ${effectiveStartOffset} to ${effectiveEndOffset} of ${totalCount}`);

      if (progressCallback) {
        progressCallback({
          category: category,
          total: effectiveMaxLimit,
          current: 0,
          status: 'starting'
        });
      }

      // Import required models
      const OdooProduct = require('../models/OdooProduct');
      const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');

      // 🔥 NOTE: We only sync products to odoo_* tables, NOT create store categories
      // Store categories should be managed separately from product sync
      console.log(`📂 Syncing products for category: ${category.complete_name} (ID: ${category.id})`);
      console.log(`💡 Store categories are not affected by this sync`);

      // 🔥 STEP 1: COMPLETELY REPLACE products in odoo_products collection for this category
      console.log(`🗑️ Clearing existing odoo_products for category ${category.complete_name}...`);
      
      // First, get all existing products in this category from odoo_products
      const existingOdooProducts = await OdooProduct.find({ categ_id: category.id });
      if (existingOdooProducts.length > 0) {
        console.log(`🗑️ Removing ${existingOdooProducts.length} existing products from odoo_products collection...`);
        await OdooProduct.deleteMany({ categ_id: category.id });
        console.log(`✅ Cleared existing odoo_products for category ${category.complete_name}`);
      }

      // 🔥 STEP 2: Fetch products from Odoo for this category using batch processing
      console.log(`📥 Fetching products from Odoo for category ${category.complete_name} using batch processing...`);
      
      let batchOffset = effectiveStartOffset;
      let processedCount = 0;
      const batchSize = 200; // Same batch size as main fetch function
      let failedAttempts = 0;
      const maxRetries = 3;
      
      console.log(`🔄 Starting batch processing loop...`);
      console.log(`   - Total products to process: ${effectiveMaxLimit}`);
      console.log(`   - Batch size: ${batchSize}`);
      console.log(`   - Start offset: ${effectiveStartOffset}`);
      console.log(`   - End offset: ${effectiveEndOffset}`);

      while (batchOffset < effectiveEndOffset && processedCount < effectiveMaxLimit) {
        try {
          const remainingInBatch = Math.min(batchSize, effectiveEndOffset - batchOffset, effectiveMaxLimit - processedCount);
          
          console.log(`\n🔄 Fetching batch: offset ${batchOffset}, limit ${remainingInBatch}`);
          
          console.log(`🔍 Calling searchRead with domain:`, JSON.stringify(domain));
          console.log(`🔍 Fields to fetch:`, [
            'id', 'product_tmpl_id', 'name', 'default_code', 'barcode',
            'list_price', 'standard_price', 'qty_available', 'virtual_available',
            'categ_id', 'uom_id', 'uom_po_id', 'type', 'sale_ok', 'purchase_ok',
            'active', 'description_sale', 'weight', 'volume',
            'barcode_unit_ids', 'barcode_unit_count',
            'create_date', 'write_date'
          ]);
          
          let products;
          try {
            products = await this.searchRead(
            'product.product',
            domain,
            [
                // Use EXACTLY the same fields as the working batch fetch function
                'id', 'product_tmpl_id', 'name', 'default_code', 'barcode',
                'list_price', 'standard_price', 'qty_available', 'virtual_available',
                'categ_id', 'uom_id', 'uom_po_id', 'type', 'sale_ok', 'purchase_ok',
                'active', 'description_sale', 'weight', 'volume',
                'barcode_unit_ids', 'barcode_unit_count',
                'create_date', 'write_date'
            ],
              batchOffset,
              remainingInBatch,
              'id'  // Use same sorting as batch fetch
            );
            console.log(`✅ searchRead successful, returned ${products ? products.length : 0} products`);
          } catch (searchError) {
            console.error(`❌ searchRead failed:`, searchError.message);
            console.error(`❌ searchRead error details:`, searchError);
            throw searchError;
          }

          if (!products || products.length === 0) {
            console.log('✅ No more products to fetch');
            break;
          }

          console.log(`📦 Processing ${products.length} products...`);

          if (!products || products.length === 0) {
            console.log('✅ No more products to fetch');
            break;
          }

          console.log(`📦 Processing ${products.length} products...`);

          // Debug: Log first product to see what fields are returned
          if (products.length > 0) {
            console.log(`🔍 Sample product data from Odoo:`, {
              id: products[0].id,
              name: products[0].name,
              qty_available: products[0].qty_available,
              virtual_available: products[0].virtual_available,
              barcode_unit_ids: products[0].barcode_unit_ids,
              hasStockFields: {
                qty_available: typeof products[0].qty_available !== 'undefined',
                virtual_available: typeof products[0].virtual_available !== 'undefined',
                barcode_unit_ids: typeof products[0].barcode_unit_ids !== 'undefined'
              }
            });
            
            // Log ALL fields returned to see what Odoo actually provides
            console.log(`🔍 All fields returned for sample product:`, Object.keys(products[0]));
            console.log(`🔍 Raw product data:`, JSON.stringify(products[0], null, 2));
          }

          // Process products into odoo_products collection
          const operations = products.map(product => {
            // Extract IDs properly (same as batch fetch)
            const categ_id = Array.isArray(product.categ_id) ? product.categ_id[0] : product.categ_id;
            const uom_id = Array.isArray(product.uom_id) ? product.uom_id[0] : product.uom_id;
            const uom_po_id = Array.isArray(product.uom_po_id) ? product.uom_po_id[0] : product.uom_po_id;
            const product_tmpl_id = Array.isArray(product.product_tmpl_id) ? product.product_tmpl_id[0] : product.product_tmpl_id;

            // Clean up default_code
            let default_code = product.default_code;
            if (default_code === false || default_code === 'false' || default_code === undefined) {
              default_code = null;
            }

            return {
              updateOne: {
                filter: { id: product.id },
                update: {
                  $set: {
                    // Explicitly set each field to ensure stock data is preserved
              id: product.id,
                    product_tmpl_id,
                    uom_id,
                    uom_po_id,
                    categ_id,
                    default_code,
              name: product.name,
              barcode: product.barcode,
                    type: product.type,
                    sale_ok: product.sale_ok,
                    purchase_ok: product.purchase_ok,
                    active: product.active,
                    description_sale: product.description_sale,
                    weight: product.weight,
                    volume: product.volume,
                    // Stock fields - explicitly ensure they are set
                    qty_available: Number(product.qty_available || 0),
                    virtual_available: Number(product.virtual_available || 0),
                    barcode_unit_ids: Array.isArray(product.barcode_unit_ids) ? product.barcode_unit_ids : [],
                    barcode_unit_count: Number(product.barcode_unit_count || 0),
                    // Price fields
                    list_price: Number(product.list_price || 0),
                    standard_price: Number(product.standard_price || 0),
                    // Timestamps
              create_date: product.create_date ? new Date(product.create_date) : new Date(),
                    write_date: product.write_date ? new Date(product.write_date) : new Date(),
                    last_stock_update: new Date(), // Track when stock was last updated
              _sync_status: 'pending',
              is_active: true,
                  }
                },
                upsert: true
              }
            };
          });

          if (operations.length > 0) {
            const result = await OdooProduct.bulkWrite(operations, { ordered: false });
            console.log(`💾 Database update result:`, {
              matchedCount: result.matchedCount,
              modifiedCount: result.modifiedCount,
              upsertedCount: result.upsertedCount,
              insertedIds: Object.keys(result.insertedIds || {}).length
            });
            
            // Verify one product was saved correctly
            if (products.length > 0) {
              const savedProduct = await OdooProduct.findOne({ id: products[0].id });
              if (savedProduct) {
                console.log(`✅ Verified saved product stock data:`, {
                  id: savedProduct.id,
                  name: savedProduct.name,
                  qty_available: savedProduct.qty_available,
                  virtual_available: savedProduct.virtual_available,
                  barcode_unit_ids: savedProduct.barcode_unit_ids,
                  last_stock_update: savedProduct.last_stock_update
                });

                // Compare original vs saved stock data
                const originalProduct = products[0];
                console.log(`🔍 Stock data comparison - Original vs Saved:`, {
                  original: {
                    qty_available: originalProduct.qty_available,
                    virtual_available: originalProduct.virtual_available,
                    barcode_unit_ids: originalProduct.barcode_unit_ids
                  },
                  saved: {
                    qty_available: savedProduct.qty_available,
                    virtual_available: savedProduct.virtual_available,
                    barcode_unit_ids: savedProduct.barcode_unit_ids
                  }
                });
              }
            }
          }

          // 🔥 STEP 3: Create OdooStock records from stock.quant (like batch fetch does)
          console.log(`📊 Creating OdooStock records for ${products.length} products...`);
          
          // Import OdooStock model
          const OdooStock = require('../models/OdooStock');
          
          for (const product of products) {
            try {
              // Fetch stock data from stock.quant for this product (location-specific)
              const stockQuants = await this.searchRead(
                'stock.quant',
                [
                  ['product_id', '=', product.id],
                  ['location_id.usage', 'in', ['internal', 'transit']]
                ],
                ['id', 'location_id', 'quantity', 'reserved_quantity', 'available_quantity', 'lot_id', 'package_id', 'owner_id', 'create_date', 'write_date'],
                0, 100
              );

              if (stockQuants && stockQuants.length > 0) {
                console.log(`📦 Product ${product.id} has stock in ${stockQuants.length} locations`);
            
                // Create OdooStock records for each location (like batch fetch does)
                const stockOperations = stockQuants.map(quant => ({
              updateOne: {
                    filter: { id: quant.id },
                update: {
                  $set: {
                        id: quant.id,
                        product_id: product.id,
                        product_name: product.name,
                        location_id: Array.isArray(quant.location_id) ? quant.location_id[0] : quant.location_id,
                        location_name: Array.isArray(quant.location_id) ? quant.location_id[1] : 'Unknown',
                        quantity: quant.quantity || 0,
                        reserved_quantity: quant.reserved_quantity || 0,
                        available_quantity: quant.available_quantity || 0,
                        lot_id: quant.lot_id ? (Array.isArray(quant.lot_id) ? quant.lot_id[0] : quant.lot_id) : null,
                        lot_name: quant.lot_id ? (Array.isArray(quant.lot_id) ? quant.lot_id[1] : null) : null,
                        package_id: quant.package_id ? (Array.isArray(quant.package_id) ? quant.package_id[0] : quant.package_id) : null,
                        owner_id: quant.owner_id ? (Array.isArray(quant.owner_id) ? quant.owner_id[0] : quant.owner_id) : null,
                        create_date: quant.create_date ? new Date(quant.create_date) : new Date(),
                        write_date: quant.write_date ? new Date(quant.write_date) : new Date(),
                    _sync_status: 'pending',
                    is_active: true,
                  }
                },
                upsert: true
              }
            }));

                // Bulk write stock records to database
                if (stockOperations.length > 0) {
                  await OdooStock.bulkWrite(stockOperations, { ordered: false });
                  console.log(`✅ Created ${stockOperations.length} OdooStock records for product ${product.id}`);
                }
                
                // Calculate total stock across all locations for display
                const totalStock = stockQuants.reduce((sum, quant) => sum + (quant.quantity || 0), 0);
                const totalAvailable = stockQuants.reduce((sum, quant) => sum + (quant.available_quantity || 0), 0);
                console.log(`📊 Product ${product.id} stock summary: Total=${totalStock}, Available=${totalAvailable}, Locations=${stockQuants.length}`);
              } else {
                console.log(`⚠️ Product ${product.id} has no stock data in internal/transit locations`);
              }
              
              // Sync barcode units if available
              if (product.barcode_unit_ids && product.barcode_unit_ids.length > 0) {
                await this.syncBarcodeUnitsForProduct(product.id, product.barcode_unit_ids);
              }
            } catch (error) {
              console.error(`❌ Error processing stock for product ${product.id}:`, error.message);
            }
          }

          processedCount += products.length;
          batchOffset += products.length;
          failedAttempts = 0; // Reset on success
          
          console.log(`📊 Progress: ${processedCount}/${effectiveMaxLimit} products processed (${Math.round(processedCount/effectiveMaxLimit*100)}%)`);

          // Update progress callback
          if (progressCallback) {
            progressCallback({
              category: category,
              total: effectiveMaxLimit,
              current: processedCount,
              synced: processedCount,
              status: 'syncing'
            });
          }

        } catch (error) {
          failedAttempts++;
          console.error(`❌ Batch failed (attempt ${failedAttempts}/${maxRetries}):`, error.message);
          
          if (failedAttempts >= maxRetries) {
            throw new Error(`Failed to process batch after ${maxRetries} attempts: ${error.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * failedAttempts));
        }
      }

      // 🔥 STEP 4: Only sync to store database if explicitly requested (preserve custom changes)
      console.log(`📋 Odoo data updated in odoo_* tables for category ${category.complete_name}`);
      console.log(`💡 To sync to store database, use the 'Sync to Store' function separately`);
      console.log(`🛡️ Store database preserved - your custom changes (images, etc.) are safe`);
      
      // Return success without touching store database
      const syncedCount = processedCount;
      const errors = [];

      if (progressCallback) {
        progressCallback({
          category: category,
          total: effectiveMaxLimit,
          current: effectiveMaxLimit,
          synced: syncedCount,
          status: 'completed'
        });
      }

      console.log(`✅ Successfully synced ${syncedCount} products for category: ${category.complete_name}`);
      console.log(`📊 Final sync summary:`, {
        categoryId: category.id,
        categoryName: category.complete_name,
        totalProducts: effectiveMaxLimit,
        syncedProducts: syncedCount,
        errors: errors.length
      });
      
      if (errors.length > 0) {
        console.log(`⚠️ ${errors.length} products had errors during sync`);
      }
      
      return {
        category: category,
        total: effectiveMaxLimit,
        synced: syncedCount,
        errors: errors
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
                originalPrice: odooProduct.standard_price || odooProduct.cost || odooProduct.list_price || 0,
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
   * Sync barcode units for a specific product
   */
  async syncBarcodeUnitsForProduct(productId, barcodeUnitIds) {
    try {
      if (!barcodeUnitIds || barcodeUnitIds.length === 0) {
        return;
      }

      console.log(`🏷️ Syncing ${barcodeUnitIds.length} barcode units for product ${productId}...`);
      
      // Import required models
      const OdooBarcodeUnit = require('../models/OdooBarcodeUnit');
      
      for (const barcodeUnitId of barcodeUnitIds) {
        try {
          // Fetch barcode unit data from Odoo
          const barcodeUnitData = await this.searchRead(
            'product.barcode.unit',
            [['id', '=', barcodeUnitId]],
            ['id', 'name', 'product_id', 'barcode', 'unit_id', 'price', 'qty_available'],
            0,
            1
          );

          if (barcodeUnitData && barcodeUnitData.length > 0) {
            const unit = barcodeUnitData[0];
            
            // Update or create barcode unit in odoo_barcode_units collection
            await OdooBarcodeUnit.updateOne(
              { id: unit.id },
              {
                $set: {
                  id: unit.id,
                  name: unit.name,
                  product_id: Array.isArray(unit.product_id) ? unit.product_id[0] : unit.product_id,
                  barcode: unit.barcode,
                  unit_id: Array.isArray(unit.unit_id) ? unit.unit_id[0] : unit.unit_id,
                  price: Number(unit.price || 0),
                  qty_available: Number(unit.qty_available || 0),
                  last_update: new Date(),
                  _sync_status: 'pending'
                }
              },
              { upsert: true }
            );
          }
        } catch (unitError) {
          console.error(`⚠️ Error syncing barcode unit ${barcodeUnitId}:`, unitError.message);
        }
      }
      
      console.log(`✅ Barcode units synced for product ${productId}`);
    } catch (error) {
      console.error(`❌ Error syncing barcode units for product ${productId}:`, error.message);
    }
  }

  /**
   * Get all categories for sync selection
   */
  async getCategoriesForSync() {
    try {
      console.log(`\n📂 Fetching main categories for sync selection from Odoo...`);

      // Get only top-level categories from Odoo (categories with no parent)
      const mainCategories = await this.searchRead(
        'product.category',
        [['parent_id', '=', false]], // Only top-level categories
        ['id', 'name', 'complete_name', 'parent_id'],
        0,
        100, // Limit to 100 main categories
        'name asc'
      );

      console.log(`✅ Found ${mainCategories.length} main categories from Odoo`);

      // Add product count for each main category (including all subcategories)
      const categoriesWithCount = await Promise.all(
        mainCategories.map(async (category) => {
          try {
            // Count products in this main category AND all its subcategories using 'child_of'
            const count = await this.searchCount('product.product', [
              ['categ_id', 'child_of', category.id], // Include all subcategories
              ['active', '=', true]
            ]);
            
            return {
              ...category,
              complete_name: category.name, // Use simple name for main categories
              product_count: count,
              is_main_category: true,
              description: `Main category containing ${count} products across all subcategories`
            };
          } catch (error) {
            console.log(`⚠️  Could not get count for main category ${category.id}: ${error.message}`);
            return {
              ...category,
              complete_name: category.name,
              product_count: 0,
              is_main_category: true,
              description: 'Main category (product count unavailable)'
            };
          }
        })
      );

      // Sort by product count (highest first) then by name
      categoriesWithCount.sort((a, b) => {
        if (b.product_count !== a.product_count) {
          return b.product_count - a.product_count;
        }
        return a.name.localeCompare(b.name);
      });

      console.log(`✅ Successfully fetched ${categoriesWithCount.length} main categories with total product counts`);
      return categoriesWithCount;
    } catch (error) {
      console.error('❌ Error fetching main categories for sync:', error.message);
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

  /**
   * Convenience: fetch list of branch locations (internal and related types)
   * Returns [{ id, name, usage }]
   */
  async getBranches(limit = 500) {
    const relevantUsages = ['internal', 'inventory', 'inventory_loss', 'loss', 'view'];
    const allLocations = await this.searchRead(
      'stock.location',
      [],
      ['id', 'complete_name', 'usage'],
      0,
      limit
    );
    const locations = (allLocations || []).filter(l => relevantUsages.includes(l.usage));
    return locations.map(l => ({ id: l.id, name: l.complete_name, usage: l.usage }));
  }
}

module.exports = new OdooService(); 