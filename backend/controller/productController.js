const Product = require("../models/Product");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Unit = require("../models/Unit");
const ProductUnit = require("../models/ProductUnit");
const { languageCodes } = require("../utils/data");

const addProduct = async (req, res) => {
  try {
    let productData = { ...req.body };

    // Validate basicUnit
    if (!productData.basicUnit) {
      return res.status(400).send({ message: "Product basicUnit is required." });
    }
    const selectedUnit = await Unit.findById(productData.basicUnit);
    if (!selectedUnit) {
      return res.status(400).send({ message: "Invalid basicUnit ID. Unit not found." });
    }

    // Handle legacy prices object if present
    if (req.body.prices) {
      productData.price = req.body.prices.price;
      delete productData.prices;
    }

    if (productData.price === undefined || productData.price === null) {
        return res.status(400).send({ message: "Product price is required (price of one basicUnit)." });
    }

    const newProduct = new Product({
      ...productData,
      productId: productData.productId || new mongoose.Types.ObjectId().toString(),
      hasMultiUnits: true,
      availableUnits: [selectedUnit._id],
    });

    await newProduct.save();

    // Create the default ProductUnit for the basic selling form
    const defaultProductUnit = new ProductUnit({
      product: newProduct._id,
      unit: newProduct.basicUnit,
      unitValue: 1,
      packQty: 1,
      price: newProduct.price,
      originalPrice: productData.originalPrice || newProduct.price,
      sku: newProduct.sku,
      barcode: newProduct.barcode,
      isDefault: true,
      isActive: true,
      createdBy: req.admin?._id || null,
    });
    await defaultProductUnit.save();

    // Populate basicUnit for the response
    const populatedProduct = await Product.findById(newProduct._id).populate('basicUnit', 'name shortCode');

    res.status(201).send(populatedProduct);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const addAllProducts = async (req, res) => {
  try {
    // console.log('product data',req.body)
    await Product.deleteMany();
    await Product.insertMany(req.body);
    res.status(200).send({
      message: "Product Added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "show" }).sort({ _id: -1 });
    res.send(products);
    // console.log("products", products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  const { title, category, price, page, limit } = req.query;

  // console.log("getAllProducts");

  let queryObject = {};
  let sortObject = {};
  if (title) {
    // Enhanced multi-word search: split words and match in order with flexible gap
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const words = title.trim().split(/\s+/).filter(Boolean);
    const lookaheadPattern = words.map(w => `(?=.*${escapeRegExp(w)})`).join('');
    const regexMatch = { $regex: `${lookaheadPattern}.*`, $options: 'i' };

    queryObject.$or = [
      { "title.en": regexMatch },
      { "title.es": regexMatch },
      { "title.fr": regexMatch },
      { "title.de": regexMatch }
    ];
  }

  if (price === "low") {
    sortObject = {
      price: 1,
    };
  } else if (price === "high") {
    sortObject = {
      price: -1,
    };
  } else if (price === "published") {
    queryObject.status = "show";
  } else if (price === "unPublished") {
    queryObject.status = "hide";
  } else if (price === "status-selling") {
    queryObject.stock = { $gt: 0 };
  } else if (price === "status-out-of-stock") {
    queryObject.stock = { $lt: 1 };
  } else if (price === "date-added-asc") {
    sortObject.createdAt = 1;
  } else if (price === "date-added-desc") {
    sortObject.createdAt = -1;
  } else if (price === "date-updated-asc") {
    sortObject.updatedAt = 1;
  } else if (price === "date-updated-desc") {
    sortObject.updatedAt = -1;
  } else {
    sortObject = { _id: -1 };
  }

  // console.log('sortObject', sortObject);

  if (category) {
    queryObject.categories = category;
  }

  const pages = Number(page) || 1;
  const limits = Number(limit) || 10;
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await Product.countDocuments(queryObject);

    const products = await Product.find(queryObject)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .populate({ path: "basicUnit", select: "_id name shortCode" })
      .sort(sortObject)
      .skip(skip)
      .limit(limits);

    res.send({
      products,
      totalDoc,
      limits,
      pages,
    });
  } catch (err) {
    // console.log("error", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    console.log(`Searching for product with slug: ${req.params.slug}`);
    
    const product = await Product.findOne({ slug: req.params.slug })
      .populate({ path: "category", select: "name _id" })
      .populate({ path: "categories", select: "name _id" })
      .populate({ path: "basicUnit", select: "name shortCode _id" })
      .lean();

    if (!product) {
      console.log(`Product not found for slug: ${req.params.slug}`);
      return res.status(404).send({ message: "Product not found" });
    }

    console.log(`Product found: ${product.title}`);

    // Set cache headers for product details
    res.set({
      'Cache-Control': 'public, max-age=600, s-maxage=1800', // Cache for 10-30 minutes
      'ETag': `W/"${product._id}-${product.updatedAt}"`,
      'Last-Modified': new Date(product.updatedAt).toUTCString()
    });

    res.send(product);
  } catch (err) {
    console.error(`Error in getProductBySlug for slug ${req.params.slug}:`, err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).send({
      message: `Error fetching product: ${err.message}`,
      slug: req.params.slug
    });
  }
};

const getProductById = async (req, res) => {
  try {
    console.log(`Getting product by ID: ${req.params.id}`);
    const product = await Product.findById(req.params.id)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .populate({ path: "basicUnit", select: "_id name shortCode isParent" });

    if (!product) return res.status(404).send({ message: "Product not found" });
    
    console.log(`Product found, basic unit details:`, {
      id: product._id,
      basicUnitId: product.basicUnit?._id,
      basicUnitName: product.basicUnit?.name,
      hasMultiUnits: product.hasMultiUnits
    });
    
    // Ensure description field exists with bilingual keys to prevent frontend errors
    if (!product.description || typeof product.description !== 'object') {
      product.description = { en: '', ar: '' };
    } else {
      if (product.description.en === undefined) product.description.en = '';
      if (product.description.ar === undefined) product.description.ar = '';
    }
    
    res.send(product);
  } catch (err) {
    console.error(`Error in getProductById: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: "Product Not Found!" });
    }

    // Keep a reference to the old basicUnit and price for comparison
    const oldBasicUnitId = product.basicUnit ? product.basicUnit.toString() : null;
    const oldPrice = product.price;

    // Update standard fields
    if (req.body.title) product.title = { ...product.title, ...req.body.title };
    if (req.body.description) product.description = { ...product.description, ...req.body.description };
    if (req.body.productId) product.productId = req.body.productId;
    if (req.body.sku) product.sku = req.body.sku;
    if (req.body.barcode) product.barcode = req.body.barcode;
    if (req.body.slug) product.slug = req.body.slug;
    if (req.body.categories) product.categories = req.body.categories;
    if (req.body.category) product.category = req.body.category;
    if (req.body.isCombination !== undefined) product.isCombination = req.body.isCombination;
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.image) product.image = req.body.image;
    if (req.body.tag) product.tag = req.body.tag;
    if (req.body.status) product.status = req.body.status;
    if (req.body.variants) product.variants = req.body.variants;

    let basicUnitChanged = false;
    let priceChanged = false;

    // Handle basicUnit update
    if (req.body.basicUnit && req.body.basicUnit.toString() !== oldBasicUnitId) {
      const newSelectedUnit = await Unit.findById(req.body.basicUnit);
      if (!newSelectedUnit) {
        return res.status(400).send({ message: "Invalid new basicUnit ID. Unit not found." });
      }
      product.basicUnit = newSelectedUnit._id;
      basicUnitChanged = true;
    }

    // Handle price update (price of one basicUnit)
    if (req.body.price !== undefined && req.body.price !== oldPrice) {
        product.price = req.body.price;
        priceChanged = true;
    }
    // Legacy prices object handling (only if new price not set directly)
    else if (req.body.prices && req.body.prices.price !== undefined && req.body.prices.price !== oldPrice) {
        product.price = req.body.prices.price;
        priceChanged = true;
    }

    await product.save();

    // If basicUnit or price changed, update the default ProductUnit
    if (basicUnitChanged || priceChanged) {
      let defaultProductUnit = await ProductUnit.findOne({
        product: product._id,
        isDefault: true,
      });

      if (defaultProductUnit) {
        if (basicUnitChanged) {
          defaultProductUnit.unit = product.basicUnit;
          // Ensure we don't set empty SKU that would cause duplicate key error
          if (product.sku && product.sku.trim() !== '') {
            defaultProductUnit.sku = product.sku;
          } else {
            // Generate a unique SKU
            const timestamp = new Date().getTime();
            const randomPart = Math.floor(Math.random() * 10000);
            defaultProductUnit.sku = `PU-${product._id.toString().substr(-6)}-1-${timestamp.toString().substr(-5)}-${randomPart}`;
          }
          defaultProductUnit.barcode = product.barcode;
          defaultProductUnit.packQty = 1; // Ensure packQty is set for basic unit
        }
        defaultProductUnit.price = product.price;
        defaultProductUnit.originalPrice = req.body.originalPrice || product.price;
        await defaultProductUnit.save();
      } else if (basicUnitChanged) {
        // Generate a unique SKU for the new default product unit
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 10000);
        const newSku = product.sku && product.sku.trim() !== '' ? 
                      product.sku : 
                      `PU-${product._id.toString().substr(-6)}-1-${timestamp.toString().substr(-5)}-${randomPart}`;
        
        const newDefaultPU = new ProductUnit({
            product: product._id,
            unit: product.basicUnit,
            unitValue: 1,
            packQty: 1,
            price: product.price,
            originalPrice: req.body.originalPrice || product.price,
            sku: newSku,
            barcode: product.barcode,
            isDefault: true,
            isActive: true,
            createdBy: req.admin?._id || null,
        });
        await newDefaultPU.save();
      }
      // Update Product.availableUnits if basicUnit changed and it's not already there
      if (product.basicUnit) {
        await Product.findByIdAndUpdate(product._id, { 
          $addToSet: { availableUnits: product.basicUnit },
          hasMultiUnits: true // Ensure hasMultiUnits is set to true
        });
      }
    } else {
      // Even if basic unit didn't change, ensure we have a default product unit
      const defaultProductUnitExists = await ProductUnit.exists({
        product: product._id,
        isDefault: true,
      });
      
      if (!defaultProductUnitExists && product.basicUnit) {
        // Generate a unique SKU
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 10000);
        const newSku = product.sku && product.sku.trim() !== '' ? 
                      product.sku : 
                      `PU-${product._id.toString().substr(-6)}-1-${timestamp.toString().substr(-5)}-${randomPart}`;
        
        const newDefaultPU = new ProductUnit({
          product: product._id,
          unit: product.basicUnit,
          unitValue: 1,
          packQty: 1,
          price: product.price,
          originalPrice: req.body.originalPrice || product.price,
          sku: newSku,
          barcode: product.barcode,
          isDefault: true,
          isActive: true,
          createdBy: req.admin?._id || null,
        });
        await newDefaultPU.save();
        
        // Ensure hasMultiUnits is set to true and basicUnit is in availableUnits
        await Product.findByIdAndUpdate(product._id, { 
          $addToSet: { availableUnits: product.basicUnit },
          hasMultiUnits: true
        });
      }
    }
    
    const populatedProduct = await Product.findById(product._id)
                                .populate('basicUnit', 'name shortCode')
                                .populate('category', '_id name')
                                .populate('categories', '_id name');

    res.send({ data: populatedProduct, message: "Product updated successfully!" });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const updateManyProducts = async (req, res) => {
  try {
    const updatedData = {};
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] !== "[]" &&
        Object.entries(req.body[key]).length > 0 &&
        req.body[key] !== req.body.ids
      ) {
        // console.log('req.body[key]', typeof req.body[key]);
        updatedData[key] = req.body[key];
      }
    }

    // console.log("updated data", updatedData);

    await Product.updateMany(
      { _id: { $in: req.body.ids } },
      {
        $set: updatedData,
      },
      {
        multi: true,
      }
    );
    res.send({
      message: "Products update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatus = (req, res) => {
  const newStatus = req.body.status;
  Product.updateOne(
    { _id: req.params.id },
    {
      $set: {
        status: newStatus,
      },
    },
    (err) => {
      if (err) {
        res.status(500).send({
          message: err.message,
        });
      } else {
        res.status(200).send({
          message: `Product ${newStatus} Successfully!`,
        });
      }
    }
  );
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({
        message: "Product not found",
      });
    }

    // Delete related ProductUnits first
    await ProductUnit.deleteMany({ 
      $or: [
        { productId: productId },
        { product: productId }
      ]
    });

    // Then delete the product itself
    await Product.findByIdAndDelete(productId);

    res.send({
      message: "Product and its associated units deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const checkProductStockAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .populate('basicUnit', 'name shortCode')
      .lean();
      
    if (!product) {
      return res.status(404).send({ 
        message: "Product not found" 
      });
    }

    // Calculate reserved stock from pending orders
    const Order = require("../models/Order");
    const pendingOrders = await Order.find({
      status: { $in: ["Pending", "Processing"] },
      'cart.productId': productId
    });

    let reservedStock = 0;
    pendingOrders.forEach(order => {
      order.cart.forEach(item => {
        if ((item.productId || item.id) === productId) {
          const packQty = item.packQty || 1;
          reservedStock += item.quantity * packQty;
        }
      });
    });

    const actualAvailableStock = Math.max(0, product.stock - reservedStock);
    
    console.log(`📊 STOCK AVAILABILITY CHECK for ${productId}:`, {
      totalStock: product.stock,
      reservedStock: reservedStock,
      actualAvailableStock: actualAvailableStock
    });

    // Get all product units for this product
    const productUnits = await ProductUnit.find({
      product: productId,
      isActive: true
    }).populate('unit', 'name shortCode packValue').lean();

    // Calculate availability for each unit considering reserved stock
    const unitAvailability = productUnits.map(unit => {
      const packQty = unit.packQty || 1;
      const availableUnits = Math.floor(actualAvailableStock / packQty);
      
      return {
        unitId: unit._id,
        unitName: unit.unit?.name || 'Unknown',
        packQty: packQty,
        price: unit.price,
        availableUnits: availableUnits,
        isAvailable: availableUnits > 0,
        isDefault: unit.isDefault || false
      };
    });

    // Filter out unavailable units
    const availableUnits = unitAvailability.filter(unit => unit.isAvailable);
    
    res.send({
      productId: product._id,
      productName: product.title,
      totalStock: product.stock,
      reservedStock: reservedStock,
      actualAvailableStock: actualAvailableStock,
      hasStock: actualAvailableStock > 0,
      units: unitAvailability,
      availableUnits: availableUnits,
      availableUnitsCount: availableUnits.length
    });
    
  } catch (err) {
    console.error("Error checking product stock availability:", err.message);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingStoreProducts = async (req, res) => {
  try {
    const queryObject = { 
      status: "show",
      stock: { $gt: 0 }  // Only show products with stock > 0
    };
    const { category, title, slug, page = 1, limit = 50 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Build efficient query object
    if (category) {
      queryObject.categories = category;
    }

    if (title) {
      // Enhanced multi-word search: split words and match in order with flexible gap
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const words = title.trim().split(/\s+/).filter(Boolean);
      const lookaheadPattern = words.map(w => `(?=.*${escapeRegExp(w)})`).join('');
      const regexMatch = { $regex: `${lookaheadPattern}.*`, $options: 'i' };

      queryObject.$or = [
        { "title.en": regexMatch },
        { "title.es": regexMatch },
        { "title.fr": regexMatch },
        { "title.de": regexMatch }
      ];
    }

    if (slug) {
      queryObject.slug = { $regex: slug, $options: "i" };
    }

    // Optimize field selection for better performance
    const productFields = 'title slug image price originalPrice discount stock status category categories basicUnit hasMultiUnits availableUnits createdAt updatedAt';
    const categoryFields = 'name _id';
    const unitFields = 'name shortCode _id';

    let products = [];
    let popularProducts = [];
    let discountedProducts = [];
    let relatedProducts = [];
    let totalProducts = 0;

    if (slug) {
      // Single product query for slug
      products = await Product.find(queryObject)
        .select(productFields)
        .populate({ path: "category", select: categoryFields })
        .populate({ path: "categories", select: categoryFields })
        .populate({ path: "basicUnit", select: unitFields })
        .sort({ _id: -1 })
        .limit(limitNum)
        .lean(); // Use lean() for better performance

      if (products.length > 0) {
        relatedProducts = await Product.find({
          category: products[0]?.category?._id,
          _id: { $ne: products[0]._id },
          stock: { $gt: 0 }  // Also filter related products
        })
        .select(productFields)
        .populate({ path: "category", select: categoryFields })
        .populate({ path: "basicUnit", select: unitFields })
        .limit(12)
        .lean();
      }
    } else {
      // Paginated search results
      const [productResults, totalCount] = await Promise.all([
        Product.find(queryObject)
          .select(productFields)
          .populate({ path: "category", select: categoryFields })
          .populate({ path: "categories", select: categoryFields })
          .populate({ path: "basicUnit", select: unitFields })
          .sort({ _id: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(queryObject)
      ]);
      
      products = productResults;
      totalProducts = totalCount;
    }

    if (!slug) {
      // Home page - fetch all categories in parallel with stock filtering
      const [popularResults, discountedResults] = await Promise.all([        
        Product.find({ 
          status: "show",
          stock: { $gt: 0 }  // Filter popular products
        })
          .select(productFields)
          .populate({ path: "category", select: categoryFields })
          .populate({ path: "basicUnit", select: unitFields })
          .sort({ sales: -1 })
          .limit(20)
          .lean(),
        
        Product.find({
          status: "show",
          stock: { $gt: 0 },  // Filter discounted products
          $or: [
            {
              $and: [
                { isCombination: true },
                { "variants.discount": { $gt: 0 } }
              ]
            },
            {
              $and: [
                { isCombination: false },
                { "prices.discount": { $gt: 0 } }
              ]
            }
          ]
        })
        .select(productFields)
        .populate({ path: "category", select: categoryFields })
        .populate({ path: "basicUnit", select: unitFields })
        .sort({ _id: -1 })
        .limit(20)
        .lean()
      ]);

      popularProducts = popularResults;
      discountedProducts = discountedResults;
    }

    // Enhanced stock filtering: Consider pending orders for all product lists
    const Order = require("../models/Order");
    const pendingOrders = await Order.find({ 
      status: { $in: ["Pending", "Processing"] }
    });
    
    // Calculate reserved stock for each product
    const reservedStock = {};
    pendingOrders.forEach(order => {
      order.cart.forEach(item => {
        const productId = (item.productId || item.id)?.toString();
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
    
    // Filter function to check actual availability
    const filterByActualStock = (productList) => {
      return productList.filter(product => {
        const productId = product._id.toString();
        const reserved = reservedStock[productId] || 0;
        const availableStock = product.stock - reserved;
        return availableStock > 0;
      });
    };
    
    // Apply filtering to all product lists
    products = filterByActualStock(products);
    popularProducts = filterByActualStock(popularProducts);
    discountedProducts = filterByActualStock(discountedProducts);
    relatedProducts = filterByActualStock(relatedProducts);
    
    console.log(`📦 PRODUCT FILTERING: Applied pending order filtering. Reserved stock for ${Object.keys(reservedStock).length} products`);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.set({
      'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5-10 minutes
      'ETag': `W/"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });

    res.send({
      products,
      popularProducts,
      relatedProducts,
      discountedProducts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error("Error in getShowingStoreProducts:", err.message);
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteManyProducts = async (req, res) => {
  try {
    const cname = req.cname;
    // console.log("deleteMany", cname, req.body.ids);

    await Product.deleteMany({ _id: req.body.ids });

    res.send({
      message: `Products Delete Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Enhanced product view with multiUnits array (for frontend)
const getEnhancedProductById = async (req, res) => {
  try {
    console.log(`Getting enhanced product by ID: ${req.params.id}`);
    
    const product = await Product.findById(req.params.id)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .populate({ path: "basicUnit", select: "_id name shortCode" });

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    // Get ProductUnits for this product
    const ProductUnit = require('../models/ProductUnit');
    const productUnits = await ProductUnit.find({
      $or: [
        { product: product._id },
        { productId: product._id }
      ]
    }).populate('unit');
    
    // Create enhanced product structure with multiUnits array
    const enhancedProduct = {
      _id: product._id,
      title: product.title,
      description: product.description,
      slug: product.slug,
      price: product.price, // Base unit price
      prices: product.prices,
      basicUnit: product.basicUnit,
      basicUnitType: product.basicUnitType,
      hasMultiUnits: product.hasMultiUnits,
      stock: product.stock,
      sales: product.sales,
      tag: product.tag,
      sku: product.sku,
      barcode: product.barcode,
      productId: product.productId,
      categories: product.categories,
      category: product.category,
      image: product.image,
      status: product.status,
      isCombination: product.isCombination,
      variants: product.variants, // Should be empty array
      availableUnits: product.availableUnits,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Enhanced multiUnits array from ProductUnit collection
      multiUnits: productUnits.map(unit => ({
        _id: unit._id,
        unit: {
          _id: unit.unit._id,
          name: unit.unit.name,
          shortCode: unit.unit.shortCode
        },
        unitType: unit.unit.unitType || 'multi',
        packQty: unit.packQty,
        price: unit.price,
        originalPrice: unit.originalPrice || unit.price,
        sku: unit.sku,
        barcode: unit.barcode,
        isDefault: unit.isDefault,
        isActive: unit.isActive,
        minOrderQuantity: unit.minOrderQuantity,
        maxOrderQuantity: unit.maxOrderQuantity,
        pricePerUnit: unit.packQty > 0 ? (unit.price / unit.packQty).toFixed(2) : "0.00"
      }))
    };
    
    console.log(`Enhanced product found with ${productUnits.length} units`);
    res.send(enhancedProduct);
    
  } catch (err) {
    console.error(`Error in getEnhancedProductById: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

// Enhanced product view by slug with multiUnits array
const getEnhancedProductBySlug = async (req, res) => {
  try {
    console.log(`Getting enhanced product by slug: ${req.params.slug}`);
    
    const product = await Product.findOne({ slug: req.params.slug })
      .populate({ path: "category", select: "name _id" })
      .populate({ path: "categories", select: "name _id" })
      .populate({ path: "basicUnit", select: "name shortCode _id" });

    if (!product) {
      console.log(`Enhanced product not found for slug: ${req.params.slug}`);
      return res.status(404).send({ message: "Product not found" });
    }

    // Get ProductUnits for this product
    const ProductUnit = require('../models/ProductUnit');
    const productUnits = await ProductUnit.find({
      $or: [
        { product: product._id },
        { productId: product._id }
      ]
    }).populate('unit');
    
    // Create enhanced product structure
    const enhancedProduct = {
      _id: product._id,
      title: product.title,
      description: product.description,
      slug: product.slug,
      price: product.price,
      prices: product.prices,
      basicUnit: product.basicUnit,
      basicUnitType: product.basicUnitType,
      hasMultiUnits: product.hasMultiUnits,
      stock: product.stock,
      sales: product.sales,
      tag: product.tag,
      sku: product.sku,
      barcode: product.barcode,
      productId: product.productId,
      categories: product.categories,
      category: product.category,
      image: product.image,
      status: product.status,
      isCombination: product.isCombination,
      variants: product.variants,
      availableUnits: product.availableUnits,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      
      // Enhanced multiUnits array
      multiUnits: productUnits.map(unit => ({
        _id: unit._id,
        unit: {
          _id: unit.unit._id,
          name: unit.unit.name,
          shortCode: unit.unit.shortCode
        },
        unitType: unit.unit.unitType || 'multi',
        packQty: unit.packQty,
        price: unit.price,
        originalPrice: unit.originalPrice || unit.price,
        sku: unit.sku,
        barcode: unit.barcode,
        isDefault: unit.isDefault,
        isActive: unit.isActive,
        minOrderQuantity: unit.minOrderQuantity,
        maxOrderQuantity: unit.maxOrderQuantity,
        pricePerUnit: unit.packQty > 0 ? (unit.price / unit.packQty).toFixed(2) : "0.00"
      }))
    };

    console.log(`Enhanced product found: ${product.title?.en} with ${productUnits.length} units`);

    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=600, s-maxage=1800',
      'ETag': `W/"${product._id}-${product.updatedAt}"`,
      'Last-Modified': new Date(product.updatedAt).toUTCString()
    });

    res.send(enhancedProduct);
    
  } catch (err) {
    console.error(`Error in getEnhancedProductBySlug for slug ${req.params.slug}:`, err.message);
    res.status(500).send({
      message: `Error fetching enhanced product: ${err.message}`,
      slug: req.params.slug
    });
  }
};

module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateManyProducts,
  updateStatus,
  deleteProduct,
  deleteManyProducts,
  getShowingStoreProducts,
  checkProductStockAvailability,
  getEnhancedProductById,
  getEnhancedProductBySlug,
};
