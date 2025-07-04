// Test script to verify promotion routes are correctly registered
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const promotionRoutes = require("./routes/promotionRoutes");

// Create a simple express app for testing
const app = express();
app.use(express.json());
app.use(cors());

// Mount the promotion routes
app.use("/api/promotions", promotionRoutes);

// Test route for direct access
app.get("/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// List all registered routes
console.log("\n=== REGISTERED ROUTES ===");
const listRoutes = () => {
  const routes = [];
  
  // Helper function to get routes from a layer
  const getRoutes = (layer) => {
    if (layer.route) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).filter(m => layer.route.methods[m])
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      const baseUrl = layer.regexp.toString()
        .replace('\\/?(?=\\/|$)', '')
        .replace('^\\/\\', '/')
        .replace('\\\\', '\\')
        .replace('(?:^|/?', '')
        .replace('(?=\\/|$)', '')
        .replace('/^', '')
        .replace('$/', '')
        .replace('/^/', '/')
        .replace('\\/?$/', '');
      
      console.log(`Router at: ${baseUrl}`);
      layer.handle.stack.forEach(getRoutes);
    }
  };
  
  // Get all routes
  app._router.stack.forEach(getRoutes);
  return routes;
};

// Print out each registered route
try {
  console.log("Routes in the promotionRoutes.js file:");
  console.log(promotionRoutes.stack.map(layer => {
    if (layer.route) {
      return `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`;
    }
    return null;
  }).filter(Boolean));
  
  console.log("\nMounted routes in the Express app:");
  const routes = listRoutes();
  routes.forEach(route => {
    console.log(`${route.methods.join(',')} ${route.path}`);
  });
} catch (err) {
  console.error("Error listing routes:", err);
}

// Start the server for manual testing
const PORT = 5056; // Use a different port for testing
app.listen(PORT, () => {
  console.log(`\nTest server running on http://localhost:${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/promotions`);
  console.log(`And test route: http://localhost:${PORT}/test`);
}); 