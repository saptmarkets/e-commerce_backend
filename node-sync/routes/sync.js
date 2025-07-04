const express = require('express');
const router = express.Router();
const odooService = require('../services/odoo-enhanced');
const { initializeDb } = require('../models');

router.get('/status', async (req, res) => {
    try {
        const isAuthenticated = await odooService.authenticate();
        res.json({ status: isAuthenticated ? 'connected' : 'disconnected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

let syncInProgress = false;
let lastSyncResult = null;
let lastSyncError = null;

router.post('/start', async (req, res) => {
    if (syncInProgress) {
        return res.status(409).json({
            error: 'Sync already in progress',
            lastSyncResult,
            lastSyncError
        });
    }

    syncInProgress = true;
    lastSyncError = null;    try {
        console.log('Ensuring database connection...');
        await initializeDb();
        
        console.log('Starting sync process...');
        const results = await odooService.syncAll();
        lastSyncResult = {
            ...results,
            timestamp: new Date(),
            success: true
        };
        res.json(lastSyncResult);
    } catch (error) {
        console.error('Sync error:', error);
        lastSyncError = {
            message: error.message,
            timestamp: new Date()
        };
        res.status(500).json({ error: error.message });
    } finally {
        syncInProgress = false;
    }
});

router.get('/progress', (req, res) => {
    res.json({
        inProgress: syncInProgress,
        lastResult: lastSyncResult,
        lastError: lastSyncError
    });
});

// Individual sync endpoints matching Python script functionality
router.post('/categories', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncCategories();
        res.json({ success: true, synced: result, type: 'categories' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/uom', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncUom();
        res.json({ success: true, synced: result, type: 'uom' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/pricelists', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncPricelists();
        res.json({ success: true, synced: result, type: 'pricelists' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncProducts();
        res.json({ success: true, synced: result, type: 'products' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/stock', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncStock();
        res.json({ success: true, synced: result, type: 'stock' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/promotions', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncPromotions();
        res.json({ success: true, synced: result, type: 'promotions' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Barcode Units sync endpoint
router.post('/barcode_units', async (req, res) => {
    try {
        await initializeDb();
        const result = await odooService.syncBarcodeUnits();
        res.json({ success: true, synced: result, type: 'barcode_units' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NEW: Individual barcode unit operations
router.get('/barcode_units/product/:productId', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const units = await odooService.getBarcodeUnitsByProduct(productId);
        res.json({ success: true, barcode_units: units });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/barcode_units/create', async (req, res) => {
    try {
        const unitData = req.body;
        const unitId = await odooService.createBarcodeUnit(unitData);
        res.json({ success: true, unit_id: unitId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/barcode_units/:unitId/sync', async (req, res) => {
    try {
        const unitId = parseInt(req.params.unitId);
        const unit = await odooService.syncSingleBarcodeUnit(unitId);
        res.json({ success: true, unit: unit });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
