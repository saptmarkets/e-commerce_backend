const axios = require('axios');

class OdooService {
  constructor() {
    this.host = process.env.ODOO_HOST || 'localhost';
    this.port = process.env.ODOO_PORT || '8069';
    this.database = process.env.ODOO_DATABASE || 'forapi_17';
    this.username = process.env.ODOO_USERNAME || 'admin';
    this.password = process.env.ODOO_PASSWORD || 'admin';
    
    this.baseUrl = `http://${this.host}:${this.port}`;
    this.uid = null;
    this.isAuthenticated = false;
    
    // Configure axios with increased timeout for large batches
    this.axiosConfig = {
      timeout: 600000, // 10 minutes (increased from 5 minutes)
      headers: {
        'Content-Type': 'application/json',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    };
  }

  /**
   * Authenticate with Odoo server
   */
  async authenticate() {
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
  }

  /**
   * Make a generic call to Odoo using XML-RPC
   */
  async callOdoo(model, method, args = [], kwargs = {}) {
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
          return this.callOdoo(model, method, args, kwargs);
        }
        
        console.error('❌ Odoo RPC Error:', response.data.error);
        throw new Error(`Odoo call failed: ${response.data.error.data?.message || 'Unknown error'}`);
      }

      // Log response details
      if (Array.isArray(response.data.result)) {
        console.log(`✅ Success: Received ${response.data.result.length} records`);
      } else {
        console.log(`✅ Success: Received result of type ${typeof response.data.result}`);
      }

      return response.data.result;
    } catch (error) {
      console.error(`❌ Error calling ${model}.${method}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
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
   * Fetch categories
   */
  async fetchCategories(domain = [], limit = 1000, offset = 0) {
    const categoryFields = [
      'id', 'name', 'complete_name', 'parent_id',
      'create_date', 'write_date'
    ];

    return await this.searchRead(
      'product.category',
      domain,
      categoryFields,
      offset,
      limit,
      'write_date desc'
    );
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