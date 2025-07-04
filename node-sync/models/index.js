const { MongoClient } = require('mongodb');

let client = null;
let db = null;
let collections = {};

// Collection configurations
const COLLECTIONS_CONFIG = {
    categories: {
        indexes: [
            { key: { category_id: 1 }, unique: true },
            { key: { parent_id: 1 } },
            { key: { write_date: 1 } }
        ]
    },
    products: {
        indexes: [
            { key: { product_tmpl_id: 1 } },
            { key: { product_id: 1 }, unique: true },
            { key: { default_code: 1 } },
            { key: { barcode: 1 } },
            { key: { write_date: 1 } },
            { key: { category_id: 1 } },
            { key: { uom_id: 1 } },
            { key: { uom_po_id: 1 } },
            { key: { barcode_unit_ids: 1 } },
            { key: { barcode_unit_count: 1 } }
        ]
    },
    barcode_units: {
        indexes: [
            { key: { unit_id: 1 }, unique: true },
            { key: { product_id: 1 } },
            { key: { barcode: 1 }, unique: true, sparse: true },
            { key: { write_date: 1 } },
            { key: { sequence: 1 } },
            { key: { active: 1 } }
        ]
    },
    uom: {
        indexes: [
            { key: { uom_id: 1 }, unique: true },
            { key: { category_id: 1 } },
            { key: { write_date: 1 } }
        ]
    },
    pricelists: {
        indexes: [
            { key: { pricelist_id: 1 }, unique: true },
            { key: { currency_id: 1 } },
            { key: { write_date: 1 } }
        ]
    },
    stock: {
        indexes: [
            { key: { quant_id: 1 }, unique: true },
            { key: { product_id: 1 } },
            { key: { location_id: 1 } },
            { key: { write_date: 1 } }
        ]
    },
    pricelist_items: {
        indexes: [
            { key: { item_id: 1 }, unique: true },
            { key: { pricelist_id: 1 } },
            { key: { product_id: 1 } },
            { key: { product_tmpl_id: 1 } },
            { key: { write_date: 1 } },
            { key: { barcode_unit_id: 1 } },
            { key: { max_quantity: 1 } }
        ]
    }
};

async function initializeDb() {
    if (client && db) {
        return { client, db, collections };
    }

    try {
        // Connect to MongoDB using IPv4
        client = new MongoClient('mongodb://127.0.0.1:27017', {
            serverSelectionTimeoutMS: 5000,
            useUnifiedTopology: true
        });

        await client.connect();
        console.log('Connected successfully to MongoDB');

        // Get database
        db = client.db('odoo_sync');

        // Initialize collections and create indexes
        for (const [collectionName, config] of Object.entries(COLLECTIONS_CONFIG)) {
            const collection = db.collection(collectionName);
            collections[collectionName] = collection;

            // Create indexes
            if (config.indexes) {
                for (const index of config.indexes) {
                    await collection.createIndex(index.key, { 
                        unique: index.unique || false,
                        background: true
                    }).catch(err => {
                        // Ignore duplicate index errors
                        if (err.code !== 85) {
                            throw err;
                        }
                    });
                }
            }
        }

        console.log('Collections and indexes initialized');
        return { client, db, collections };
    } catch (err) {
        console.error('Error initializing MongoDB:', err);
        if (client) {
            await client.close();
        }
        client = null;
        db = null;
        collections = {};
        throw err;
    }
}

// Export the database functions and collections
module.exports = {
    initializeDb,
    getCollections: () => collections,
    getDb: () => db,
    getClient: () => client
};
