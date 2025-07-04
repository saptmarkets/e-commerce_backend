require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const syncRoutes = require('./routes/sync');
const viewRoutes = require('./routes/view');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import database connection
const { initializeDb } = require('./models');

// Initialize database connection
initializeDb()
    .then(() => {
        console.log('Database initialized');
        // Start server only after database is initialized
        const PORT = process.env.PORT || 7000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database initialization error:', err);
        process.exit(1);
    });

// Routes
app.use('/sync', syncRoutes);
app.use('/view', viewRoutes);

// Home route - Enhanced Dashboard
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Odoo MongoDB Sync Dashboard',
        odooHost: process.env.ODOO_HOST,
        odooPort: process.env.ODOO_PORT,
        odooDb: process.env.ODOO_DB
    });
});

// Legacy route for old index
app.get('/old', (req, res) => {
    res.render('index', {
        title: 'Odoo Sync Dashboard',
        odooHost: process.env.ODOO_HOST,
        odooPort: process.env.ODOO_PORT,
        odooDb: process.env.ODOO_DB
    });
});

// No need for this section anymore, moved to database initialization block
