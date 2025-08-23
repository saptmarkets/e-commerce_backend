const mongoose = require('mongoose');

const stockMovementLogSchema = new mongoose.Schema({
  movement_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  movement_type: {
    type: String,
    enum: ['sale', 'purchase', 'adjustment', 'return', 'transfer', 'sync'],
    required: true
  },
  quantity_before: {
    type: Number,
    required: true,
    default: 0
  },
  quantity_changed: {
    type: Number,
    required: true
  },
  quantity_after: {
    type: Number,
    required: true
  },
  movement_date: {
    type: Date,
    default: Date.now
  },
  invoice_number: {
    type: String,
    trim: true
  },
  reference_document: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  store_location: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  cost_per_unit: {
    type: Number,
    default: 0
  },
  total_value: {
    type: Number,
    default: 0
  },
  // Odoo sync specific fields
  odoo_sync_status: {
    type: String,
    enum: ['pending', 'synced', 'failed', 'retry'],
    default: 'pending'
  },
  odoo_sync_attempts: {
    type: Number,
    default: 0
  },
  odoo_last_sync_attempt: {
    type: Date
  },
  odoo_response: {
    type: mongoose.Schema.Types.Mixed
  },
  odoo_error_message: {
    type: String
  },
  odoo_request_payload: {
    type: mongoose.Schema.Types.Mixed
  },
  odoo_record_id: {
    type: String
  },
  // Enhanced product identification fields for combo deals
  product_title: {
    type: String,
    trim: true
  },
  product_sku: {
    type: String,
    trim: true
  },
  odoo_id: {
    type: String
  },
  is_combo_deal: {
    type: Boolean,
    default: false
  },
  combo_reference: {
    type: String,
    trim: true
  },
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SyncBatch'
  },
  priority: {
    type: Number,
    default: 1
  },
  retry_after: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
stockMovementLogSchema.index({ movement_date: -1 });
stockMovementLogSchema.index({ product: 1, movement_date: -1 });
stockMovementLogSchema.index({ movement_type: 1 });
stockMovementLogSchema.index({ odoo_sync_status: 1 });
stockMovementLogSchema.index({ user: 1 });
stockMovementLogSchema.index({ invoice_number: 1 });
stockMovementLogSchema.index({ batch_id: 1 });

// Virtual for movement direction
stockMovementLogSchema.virtual('is_incoming').get(function() {
  return this.quantity_changed > 0;
});

// Virtual for movement direction
stockMovementLogSchema.virtual('is_outgoing').get(function() {
  return this.quantity_changed < 0;
});

// Method to get movements with filters and pagination
stockMovementLogSchema.statics.getMovementsWithFilters = async function(filters = {}, options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'movement_date',
      sortOrder = 'desc',
      startDate,
      endDate,
      movementType,
      syncStatus,
      productId,
      userId,
      invoiceNumber,
      search
    } = options;

    // Build query
    const query = { ...filters };

    // Date range filter
    if (startDate || endDate) {
      query.movement_date = {};
      if (startDate) query.movement_date.$gte = new Date(startDate);
      if (endDate) query.movement_date.$lte = new Date(endDate);
    }

    // Other filters
    if (movementType) query.movement_type = movementType;
    if (syncStatus) query.odoo_sync_status = syncStatus;
    if (productId) query.product = productId;
    if (userId) query.user = userId;
    if (invoiceNumber) query.invoice_number = { $regex: invoiceNumber, $options: 'i' };

    // Search filter
    if (search) {
      query.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { reference_document: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [movements, total] = await Promise.all([
      this.find(query)
        .populate('product', 'title image price currentStock')
        .populate('user', 'name email')
        .populate('batch_id', 'batch_name batch_status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      movements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error in getMovementsWithFilters:', error);
    throw error;
  }
};

// Method to update sync status
stockMovementLogSchema.methods.updateSyncStatus = async function(status, response = null, error = null) {
  this.odoo_sync_status = status;
  this.odoo_sync_attempts += 1;
  this.odoo_last_sync_attempt = new Date();
  
  if (response) {
    this.odoo_response = response;
  }
  
  if (error) {
    this.odoo_error_message = error;
  }
  
  return await this.save();
};

// Method to create movement from order
stockMovementLogSchema.statics.createFromOrder = async function(orderData) {
  try {
    const movements = [];
    
    for (const item of orderData.items) {
      const movement = new this({
        product: item.product,
        movement_type: 'sale',
        quantity_before: item.product.currentStock || 0,
        quantity_changed: -item.quantity, // Negative for sales
        quantity_after: (item.product.currentStock || 0) - item.quantity,
        invoice_number: orderData.invoice_number,
        reference_document: `Order: ${orderData._id}`,
        user: orderData.admin_id,
        cost_per_unit: item.price,
        total_value: item.price * item.quantity,
        odoo_sync_status: 'pending'
      });
      
      movements.push(await movement.save());
    }
    
    return movements;
  } catch (error) {
    console.error('Error creating movements from order:', error);
    throw error;
  }
};

const StockMovementLog = mongoose.model('StockMovementLog', stockMovementLogSchema);

module.exports = StockMovementLog; 