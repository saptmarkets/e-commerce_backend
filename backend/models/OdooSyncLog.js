const mongoose = require("mongoose");

const odooSyncLogSchema = new mongoose.Schema(
  {
    // Sync operation details
    operation_type: {
      type: String,
      enum: ['fetch_from_odoo', 'import_to_store', 'reverse_stock_sync'],
      required: true,
      index: true,
    },
    
    // Data type being synced
    data_type: {
      type: String,
      enum: ['products', 'categories', 'uom', 'pricelists', 'pricelist_items', 'stock', 'barcode_units', 'all'],
      required: true,
      index: true,
    },
    
    // Sync status
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'failed', 'cancelled'],
      required: true,
      index: true,
    },
    
    // Timing information
    started_at: {
      type: Date,
      required: true,
      index: true,
    },
    completed_at: {
      type: Date,
    },
    duration_ms: {
      type: Number,
    },
    
    // Results and statistics
    total_records: {
      type: Number,
      default: 0,
    },
    processed_records: {
      type: Number,
      default: 0,
    },
    successful_records: {
      type: Number,
      default: 0,
    },
    failed_records: {
      type: Number,
      default: 0,
    },
    skipped_records: {
      type: Number,
      default: 0,
    },
    
    // Error information
    error_message: {
      type: String,
    },
    error_stack: {
      type: String,
    },
    error_details: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Configuration used
    sync_config: {
      incremental: {
        type: Boolean,
        default: false,
      },
      dry_run: {
        type: Boolean,
        default: false,
      },
      batch_size: {
        type: Number,
        default: 100,
      },
      filters: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    
    // User who triggered the sync
    triggered_by: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
      },
      user_name: {
        type: String,
      },
      trigger_type: {
        type: String,
        enum: ['manual', 'scheduled', 'automatic'],
        default: 'manual',
      },
    },
    
    // Additional metadata
    odoo_connection: {
      host: String,
      database: String,
      last_sync_date: Date,
    },
    
    // Detailed results per record type
    detailed_results: [{
      record_id: Number,
      record_name: String,
      action: {
        type: String,
        enum: ['created', 'updated', 'skipped', 'failed'],
      },
      error_message: String,
      changes: mongoose.Schema.Types.Mixed,
    }],
    
    // Performance metrics
    performance_metrics: {
      odoo_query_time_ms: Number,
      database_write_time_ms: Number,
      validation_time_ms: Number,
      memory_usage_mb: Number,
    },
  },
  {
    timestamps: true,
    collection: 'odoo_sync_logs',
  }
);

// Indexes for performance and querying
odooSyncLogSchema.index({ started_at: -1 });
odooSyncLogSchema.index({ operation_type: 1, data_type: 1 });
odooSyncLogSchema.index({ status: 1, started_at: -1 });
odooSyncLogSchema.index({ 'triggered_by.user_id': 1 });

// TTL index to automatically delete old logs after 90 days
odooSyncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual for calculating success rate
odooSyncLogSchema.virtual('success_rate').get(function() {
  if (this.total_records === 0) return 0;
  return Math.round((this.successful_records / this.total_records) * 100);
});

// Method to mark sync as completed
odooSyncLogSchema.methods.markCompleted = function(results) {
  this.status = 'completed';
  this.completed_at = new Date();
  this.duration_ms = this.completed_at - this.started_at;
  
  if (results) {
    this.total_records = results.total || 0;
    this.processed_records = results.processed || 0;
    this.successful_records = results.successful || 0;
    this.failed_records = results.failed || 0;
    this.skipped_records = results.skipped || 0;
  }
  
  return this.save();
};

// Method to mark sync as failed
odooSyncLogSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.completed_at = new Date();
  this.duration_ms = this.completed_at - this.started_at;
  this.error_message = error.message;
  this.error_stack = error.stack;
  
  return this.save();
};

// Static method to create new sync log
odooSyncLogSchema.statics.startSync = function(operationType, dataType, config = {}, user = null) {
  return this.create({
    operation_type: operationType,
    data_type: dataType,
    status: 'started',
    started_at: new Date(),
    sync_config: config,
    triggered_by: user ? {
      user_id: user._id,
      user_name: (function(nameObj){
        if (!nameObj) return '';
        if (typeof nameObj === 'string') return nameObj;
        if (typeof nameObj === 'object') {
          // try common language keys first
          const candidates = ['en', 'ar', 'fr', 'es'];
          for (const key of candidates) {
            if (nameObj[key]) return nameObj[key];
          }
          // fallback to first value
          const firstVal = Object.values(nameObj)[0];
          if (typeof firstVal === 'string') return firstVal;
          // last resort: stringify
          return JSON.stringify(nameObj);
        }
        return String(nameObj);
      })(user.name),
      trigger_type: 'manual',
    } : {
      trigger_type: 'scheduled',
    },
  });
};

module.exports = mongoose.model("OdooSyncLog", odooSyncLogSchema); 