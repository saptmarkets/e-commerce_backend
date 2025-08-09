const StockMovementLog = require('../models/StockMovementLog');
const SyncBatch = require('../models/SyncBatch');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

/**
 * Get all stock movements with filtering and pagination
 */
const getStockMovements = async (req, res) => {
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
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1,
      startDate,
      endDate,
      movementType,
      syncStatus,
      productId,
      userId,
      invoiceNumber,
      search
    };

    const result = await StockMovementLog.getMovementsWithFilters({}, options);

    res.json({
      success: true,
      data: result.movements,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movements',
      error: error.message
    });
  }
};

/**
 * Get specific stock movement by ID
 */
const getStockMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movement = await StockMovementLog.findById(id)
      .populate('product', 'title image price currentStock')
      .populate('user', 'name email')
      .lean();

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    res.json({
      success: true,
      data: movement
    });
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movement',
      error: error.message
    });
  }
};

/**
 * Create new stock movement
 */
const createStockMovement = async (req, res) => {
  try {
    const {
      product_id,
      movement_type,
      quantity_changed,
      invoice_number,
      reference_document,
      reason,
      cost_per_unit,
      store_location
    } = req.body;

    // Get current product stock
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const quantity_before = product.currentStock || 0;
    const quantity_after = quantity_before + quantity_changed;
    const total_value = Math.abs(quantity_changed) * (cost_per_unit || product.price || 0);

    // Create movement log
    const movementData = {
      product: product_id,
      movement_type,
      quantity_before,
      quantity_changed,
      quantity_after,
      invoice_number,
      reference_document,
      user: req.admin._id,
      reason,
      cost_per_unit: cost_per_unit || product.price || 0,
      total_value,
      store_location: store_location || 'Main Store'
    };

    const movement = await StockMovementLog.createMovement(movementData);

    // Update product stock
    await Product.findByIdAndUpdate(product_id, {
      currentStock: quantity_after,
      lastMovementDate: new Date()
    });

    // Populate the created movement
    const populatedMovement = await StockMovementLog.findById(movement._id)
      .populate('product', 'title image price')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Stock movement created successfully',
      data: populatedMovement
    });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock movement',
      error: error.message
    });
  }
};

/**
 * Update stock movement
 */
const updateStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const movement = await StockMovementLog.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('product', 'title image price')
    .populate('user', 'name email');

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock movement updated successfully',
      data: movement
    });
  } catch (error) {
    console.error('Error updating stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock movement',
      error: error.message
    });
  }
};

/**
 * Delete stock movement (soft delete)
 */
const deleteStockMovement = async (req, res) => {
  try {
    const { id } = req.params;

    const movement = await StockMovementLog.findById(id);
    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    // Soft delete by marking as deleted
    movement.deleted = true;
    movement.deletedAt = new Date();
    movement.deletedBy = req.admin._id;
    await movement.save();

    res.json({
      success: true,
      message: 'Stock movement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stock movement',
      error: error.message
    });
  }
};

/**
 * Get movements for specific product
 */
const getProductMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      productId,
      sortBy: 'movement_date',
      sortOrder: -1
    };

    const result = await StockMovementLog.getMovementsWithFilters({}, options);

    res.json({
      success: true,
      data: result.movements,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching product movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product movements',
      error: error.message
    });
  }
};

/**
 * Get movement statistics
 */
const getMovementStatistics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const [
      todayMovements,
      weekMovements,
      pendingSync,
      successfulSync,
      failedSync,
      totalMovements
    ] = await Promise.all([
      StockMovementLog.countDocuments({
        movement_date: { $gte: today }
      }),
      StockMovementLog.countDocuments({
        movement_date: { $gte: weekStart }
      }),
      StockMovementLog.countDocuments({
        odoo_sync_status: 'pending'
      }),
      StockMovementLog.countDocuments({
        odoo_sync_status: 'success'
      }),
      StockMovementLog.countDocuments({
        odoo_sync_status: 'failed'
      }),
      StockMovementLog.countDocuments()
    ]);

    // Get movement type breakdown
    const movementTypeStats = await StockMovementLog.aggregate([
      {
        $group: {
          _id: '$movement_type',
          count: { $sum: 1 },
          totalValue: { $sum: '$total_value' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          todayMovements,
          weekMovements,
          pendingSync,
          successfulSync,
          failedSync,
          totalMovements
        },
        movementTypes: movementTypeStats,
        syncSuccessRate: totalMovements > 0 ? 
          Math.round((successfulSync / totalMovements) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching movement statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movement statistics',
      error: error.message
    });
  }
};

/**
 * Sync specific movement to Odoo
 */
const syncMovementToOdoo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movement = await StockMovementLog.findById(id)
      .populate('product');

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    // Update sync status to syncing
    await movement.updateSyncStatus('syncing');

    try {
      // Here you would implement the actual Odoo sync logic
      // For now, we'll simulate it
      const odooResponse = {
        success: true,
        odoo_id: `ODO-${Date.now()}`,
        message: 'Movement synced successfully'
      };

      await movement.updateSyncStatus('success', odooResponse);

      res.json({
        success: true,
        message: 'Movement synced to Odoo successfully',
        data: movement
      });
    } catch (syncError) {
      await movement.updateSyncStatus('failed', null, syncError.message);
      throw syncError;
    }
  } catch (error) {
    console.error('Error syncing movement to Odoo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync movement to Odoo',
      error: error.message
    });
  }
};

/**
 * Bulk sync movements to Odoo
 */
const bulkSyncMovements = async (req, res) => {
  try {
    const { movementIds, batchName } = req.body;

    if (!movementIds || !Array.isArray(movementIds) || movementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movement IDs are required'
      });
    }

    // Create sync batch
    const batch = await SyncBatch.createBatch({
      batch_name: batchName || undefined,
      batch_type: 'manual',
      created_by: req.admin._id,
      description: `Bulk sync of ${movementIds.length} movements`
    }, movementIds);

    // Start batch processing
    await batch.startBatch();

    // Process movements (this could be done in background)
    let successful = 0;
    let failed = 0;

    for (const movementId of movementIds) {
      try {
        const movement = await StockMovementLog.findById(movementId);
        if (movement) {
          await movement.updateSyncStatus('syncing');
          
          // Simulate Odoo sync
          const odooResponse = {
            success: true,
            odoo_id: `ODO-${Date.now()}-${movementId.slice(-6)}`,
            message: 'Movement synced successfully'
          };
          
          await movement.updateSyncStatus('success', odooResponse);
          successful++;
        }
      } catch (error) {
        const movement = await StockMovementLog.findById(movementId);
        if (movement) {
          await movement.updateSyncStatus('failed', null, error.message);
        }
        failed++;
      }
    }

    // Update batch with results
    batch.successful_syncs = successful;
    batch.failed_syncs = failed;
    batch.pending_syncs = 0;
    await batch.updateProgress();

    res.json({
      success: true,
      message: 'Bulk sync completed',
      data: {
        batchId: batch._id,
        batchName: batch.batch_name,
        successful,
        failed,
        total: movementIds.length
      }
    });
  } catch (error) {
    console.error('Error in bulk sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk sync',
      error: error.message
    });
  }
};

/**
 * Get sync batches
 */
const getSyncBatches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      SyncBatch.find()
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SyncBatch.countDocuments()
    ]);

    res.json({
      success: true,
      data: batches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sync batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync batches',
      error: error.message
    });
  }
};

/**
 * Export movements to CSV
 */
const exportMovements = async (req, res) => {
  try {
    const { movementIds, filters } = req.body;
    
    let query = {};
    if (movementIds && movementIds.length > 0) {
      query._id = { $in: movementIds };
    } else if (filters) {
      // Apply filters for export
      const {
        startDate,
        endDate,
        movementType,
        syncStatus,
        productId
      } = filters;

      if (startDate || endDate) {
        query.movement_date = {};
        if (startDate) query.movement_date.$gte = new Date(startDate);
        if (endDate) query.movement_date.$lte = new Date(endDate);
      }
      if (movementType) query.movement_type = movementType;
      if (syncStatus) query.odoo_sync_status = syncStatus;
      if (productId) query.product = productId;
    }

    const movements = await StockMovementLog.find(query)
      .populate('product', 'title')
      .populate('user', 'name')
      .sort({ movement_date: -1 })
      .lean();

    // Create CSV content
    let csvContent = 'Movement ID,Date,Product,Type,Quantity Changed,Before,After,Invoice,User,Sync Status,Error\n';
    
    movements.forEach(movement => {
      const row = [
        movement.movement_id,
        new Date(movement.movement_date).toISOString(),
        movement.product?.title || 'Unknown',
        movement.movement_type,
        movement.quantity_changed,
        movement.quantity_before,
        movement.quantity_after,
        movement.invoice_number || '',
        movement.user?.name || 'Unknown',
        movement.odoo_sync_status,
        movement.error_message || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stock-movements-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export movements',
      error: error.message
    });
  }
};

/**
 * Test endpoint to create a stock movement manually
 */
const testCreateStockMovement = async (req, res) => {
  try {
    console.log('🧪 TEST: Creating stock movement manually');
    
    const testMovement = await StockMovementLog.create({
      product: req.body.productId || '507f1f77bcf86cd799439011', // Use a test product ID
      movement_type: 'sale',
      quantity_before: 100,
      quantity_changed: -5,
      quantity_after: 95,
      invoice_number: 'TEST-001',
      reference_document: 'Test Order',
      user: req.admin._id,
      cost_per_unit: 10,
      total_value: 50,
      odoo_sync_status: 'pending'
    });
    
    console.log('✅ TEST: Stock movement created successfully:', testMovement._id);
    
    res.status(201).json({
      success: true,
      message: 'Test stock movement created successfully',
      data: testMovement
    });
  } catch (error) {
    console.error('❌ TEST: Error creating test stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test stock movement',
      error: error.message
    });
  }
};

module.exports = {
  getStockMovements,
  getStockMovementById,
  createStockMovement,
  updateStockMovement,
  deleteStockMovement,
  getProductMovements,
  getMovementStatistics,
  syncMovementToOdoo,
  bulkSyncMovements,
  getSyncBatches,
  exportMovements,
  testCreateStockMovement
}; 