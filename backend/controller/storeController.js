const getShowingStoreProducts = async (req, res) => {
  try {
    const { category, title, sortBy, sortOrder } = req.query;
    
    // Build query
    let query = { 
      status: "show",
      stock: { $gt: 0 } // Only show products with stock > 0
    };
    
    if (category) {
      query["category._id"] = { $in: category.split(",") };
    }
    
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sortOptions[sortBy] = order;
    } else {
      sortOptions = { createdAt: -1 }; // Default sort
    }
    
    // Get products
    let products = await Product.find(query)
      .populate("category", "name")
      .sort(sortOptions);
    
    // Enhanced stock availability calculation considering pending orders
    const Order = require("../models/Order");
    
    // Get all pending orders to calculate reserved stock
    const pendingOrders = await Order.find({ 
      status: { $in: ["Pending", "Processing"] }
    });
    
    // Calculate reserved stock for each product
    const reservedStock = {};
    pendingOrders.forEach(order => {
      order.cart.forEach(item => {
        const productId = item.productId || item.id;
        if (productId) {
          const packQty = item.packQty || 1;
          const reservedQty = item.quantity * packQty;
          
          if (reservedStock[productId]) {
            reservedStock[productId] += reservedQty;
          } else {
            reservedStock[productId] = reservedQty;
          }
        }
      });
    });
    
    // Filter products based on actual available stock (considering reservations)
    products = products.filter(product => {
      const productId = product._id.toString();
      const reserved = reservedStock[productId] || 0;
      const availableStock = product.stock - reserved;
      
      // Only show products that have stock available after pending orders
      return availableStock > 0;
    });
    
    console.log(`Showing ${products.length} products with available stock (considering pending orders)`);
    
    res.send(products);
  } catch (err) {
    console.error("Error in getShowingStoreProducts:", err.message);
    res.status(500).send({
      message: err.message,
    });
  }
}; 