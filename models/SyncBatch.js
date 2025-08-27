const mongoose = require('mongoose');

const syncBatchSchema = new mongoose.Schema({
  batch_name: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[-:T]/g, '');
      return `BATCH-${timestamp}`;
    }
  },
  batch_type: {
    type: String,
    enum: ['manual', 'scheduled', 'retry', 'bulk'],
    default: 'manual'
  },
  total_records: {
    type: Number,
    required: true,
    default: 0
  },
  successful_syncs: {
    type: Number,
    default: 0
  },
  failed_syncs: {
    type: Number,
    default: 0
  },
  pending_syncs: {
    type: Number,
    default: 0
  },
  batch_status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'partial'],
    default: 'pending'
  },
  started_at: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  description: {
    type: String
  },
  movement_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockMovementLog'
  }],
  error_summary: {
    type: String
  },
  progress_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes
syncBatchSchema.index({ batch_status: 1 });
syncBatchSchema.index({ created_by: 1 });
syncBatchSchema.index({ started_at: -1 });

// Virtual for success rate
syncBatchSchema.virtual('success_rate').get(function() {
  if (this.total_records === 0) return 0;
  return Math.round((this.successful_syncs / this.total_records) * 100);
});

// Method to update batch progress
syncBatchSchema.methods.updateProgress = function() {
  const processed = this.successful_syncs + this.failed_syncs;
  this.progress_percentage = this.total_records > 0 ? 
    Math.round((processed / this.total_records) * 100) : 0;
  
  // Update status based on progress
  if (this.progress_percentage === 100) {
    this.batch_status = this.failed_syncs === 0 ? 'completed' : 'partial';
    this.completed_at = new Date();
  } else if (processed > 0) {
    this.batch_status = 'in_progress';
  }
  
  return this.save();
};

// Method to start batch
syncBatchSchema.methods.startBatch = function() {
  this.batch_status = 'in_progress';
  this.started_at = new Date();
  return this.save();
};

// Static method to create batch with movements
syncBatchSchema.statics.createBatch = async function(data, movementIds = []) {
  const batch = new this({
    ...data,
    total_records: movementIds.length,
    pending_syncs: movementIds.length,
    movement_ids: movementIds
  });
  
  await batch.save();
  
  // Update movement logs with batch ID
  if (movementIds.length > 0) {
    await mongoose.model('StockMovementLog').updateMany(
      { _id: { $in: movementIds } },
      { batch_id: batch.batch_name }
    );
  }
  
  return batch;
};

module.exports = mongoose.model('SyncBatch', syncBatchSchema); 