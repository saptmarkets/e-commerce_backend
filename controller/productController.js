const Product = require("../models/Product");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Unit = require("../models/Unit");
const ProductUnit = require("../models/ProductUnit");
const { languageCodes } = require("../utils/data");

// Helper function to get all child category IDs for a parent, or just itself if no children
// This function expects a Mongoose ObjectId as input for categoryId
const getAllChildCategoryIds = async (categoryId) => {
  // We already validate/convert categoryId in the calling functions (getAllProducts, getShowingStoreProducts)
  // so at this point, categoryId is expected to be a valid mongoose.Types.ObjectId instance.
  
  const allIds = [categoryId];
  const queue = [categoryId.toString()];
  const seen = new Set(queue);
  
  console.log(`🔍 getAllChildCategoryIds: Starting with categoryId: ${categoryId}`);
  
  while (queue.length) {
    const currentParentIds = [...queue];
    queue.length = 0;
    
    console.log(`🔍 getAllChildCategoryIds: Processing parent IDs: ${currentParentIds.join(', ')}`);
    
    // Query for children using both string and ObjectId comparisons
    const children = await Category.find({
      $or: [
        { parentId: { $in: currentParentIds } },
        { parentId: { $in: currentParentIds.map(id => id.toString()) } }
      ]
    }, { _id: 1, parentId: 1, name: 1 }).lean();
    
    console.log(`🔍 getAllChildCategoryIds: Found ${children.length} children for parents: ${currentParentIds.join(', ')}`);
    
    for (const child of children) {
      const childIdStr = child._id.toString();
      if (!seen.has(childIdStr)) {
        console.log(`🔍 getAllChildCategoryIds: Adding child category: ${child.name?.en || child.name} (${child._id})`);
        allIds.push(child._id);
        seen.add(childIdStr);
        queue.push(childIdStr);
      }
    }
  }
  
  console.log(`🔍 getAllChildCategoryIds: Final result - ${allIds.length} category IDs: ${allIds.map(id => id.toString()).join(', ')}`);
  
  // Return parent ID and all descendant IDs as ObjectIds
  return allIds;
};

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
  const { title, category, price, page, limit, searchType } = req.query;

  // console.log("getAllProducts");

  let queryObject = {};
  let sortObject = {};

  let categoryIdsToQuery = [];
  if (category) {
    try {
      // Convert the incoming category string to ObjectId
      const categoryObjectId = new mongoose.Types.ObjectId(category);
      categoryIdsToQuery = await getAllChildCategoryIds(categoryObjectId);
      console.log('getAllProducts categoryIdsToQuery (after conversion):', categoryIdsToQuery); // Debug log
    } catch (error) {
      console.error("Error in getAllProducts when converting category ID:", error);
      // If the category ID is invalid, treat as if no category was provided
      categoryIdsToQuery = [];
    }
  }

  if (title) {
    // Enhanced comprehensive search: search across multiple fields
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchTerm = title.trim();
    
    // Create regex patterns for different search strategies
    const exactMatch = { $regex: `^${escapeRegExp(searchTerm)}$`, $options: 'i' };
    const startsWithMatch = { $regex: `^${escapeRegExp(searchTerm)}`, $options: 'i' };
    const containsMatch = { $regex: escapeRegExp(searchTerm), $options: 'i' };
    
    // For multi-word searches, use lookahead pattern
    const words = searchTerm.split(/\s+/).filter(Boolean);
    const lookaheadPattern = words.map(w => `(?=.*${escapeRegExp(w)})`).join('');
    const multiWordMatch = { $regex: `${lookaheadPattern}.*`, $options: 'i' };

    // Handle different search types
    if (searchType === 'barcode') {
      // Barcode only search
      queryObject.$or = [
        { "barcode": exactMatch },
        { "barcode": startsWithMatch },
        { "barcode": containsMatch }
      ];
    } else if (searchType === 'sku') {
      // SKU only search
      queryObject.$or = [
        { "sku": exactMatch },
        { "sku": startsWithMatch },
        { "sku": containsMatch },
        { "default_code": exactMatch },
        { "default_code": startsWithMatch },
        { "default_code": containsMatch }
      ];
    } else if (searchType === 'id') {
      // Product ID only search - validate ObjectId first
      if (mongoose.Types.ObjectId.isValid(searchTerm)) {
        queryObject.$or = [
          { "_id": searchTerm },
          { "productId": exactMatch },
          { "productId": startsWithMatch },
          { "productId": containsMatch }
        ];
      } else {
        // If not a valid ObjectId, search by productId field instead
        queryObject.$or = [
          { "productId": exactMatch },
          { "productId": startsWithMatch },
          { "productId": containsMatch }
        ];
      }
    } else if (searchType === 'name') {
      // Name only search
      queryObject.$or = [
        { "title.en": exactMatch },
        { "title.en": startsWithMatch },
        { "title.en": containsMatch },
        { "title.en": multiWordMatch },
        { "title.ar": exactMatch },
        { "title.ar": startsWithMatch },
        { "title.ar": containsMatch },
        { "title.ar": multiWordMatch },
        { "title.es": exactMatch },
        { "title.es": startsWithMatch },
        { "title.es": containsMatch },
        { "title.es": multiWordMatch },
        { "title.fr": exactMatch },
        { "title.fr": startsWithMatch },
        { "title.fr": containsMatch },
        { "title.fr": multiWordMatch },
        { "title.de": exactMatch },
        { "title.de": startsWithMatch },
        { "title.de": containsMatch },
        { "title.de": multiWordMatch },
        { "name": exactMatch },
        { "name": startsWithMatch },
        { "name": containsMatch },
        { "name": multiWordMatch }
      ];
    } else {
      // All fields search (default)
      const searchConditions = [
        // Title searches (all languages including Arabic)
        { "title.en": exactMatch },
        { "title.en": startsWithMatch },
        { "title.en": containsMatch },
        { "title.en": multiWordMatch },
        { "title.ar": exactMatch },
        { "title.ar": startsWithMatch },
        { "title.ar": containsMatch },
        { "title.ar": multiWordMatch },
        { "title.es": exactMatch },
        { "title.es": startsWithMatch },
        { "title.es": containsMatch },
        { "title.es": multiWordMatch },
        { "title.fr": exactMatch },
        { "title.fr": startsWithMatch },
        { "title.fr": containsMatch },
        { "title.fr": multiWordMatch },
        { "title.de": exactMatch },
        { "title.de": startsWithMatch },
        { "title.de": containsMatch },
        { "title.de": multiWordMatch },
        
        // Name searches (fallback field)
        { "name": exactMatch },
        { "name": startsWithMatch },
        { "name": containsMatch },
        { "name": multiWordMatch },
        
        // Barcode and SKU searches (exact matches first)
        { "barcode": exactMatch },
        { "barcode": startsWithMatch },
        { "barcode": containsMatch },
        { "sku": exactMatch },
        { "sku": startsWithMatch },
        { "sku": containsMatch },
        { "default_code": exactMatch },
        { "default_code": startsWithMatch },
        { "default_code": containsMatch },
        
        // Product ID searches - only add _id search if it's a valid ObjectId
        { "productId": exactMatch },
        { "productId": startsWithMatch },
        { "productId": containsMatch },
      ];
      
      // Add ObjectId search only if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(searchTerm)) {
        searchConditions.push({ "_id": searchTerm });
      }
      
      // Add remaining search conditions
      searchConditions.push(
        // Slug searches
        { "slug": containsMatch },
        
        // Description searches
        { "description.en": containsMatch },
        { "description.ar": containsMatch },
        
        // Brand/Manufacturer searches
        { "brand": containsMatch },
        { "manufacturer": containsMatch },
        
        // Tags searches - use $in only for exact matches
        { "tags": containsMatch },
        
        // Category name searches (if populated)
        { "categoryName": containsMatch },
        
        // Product unit searches (if populated)
        { "productUnits.name": containsMatch },
        { "productUnits.shortCode": containsMatch }
      );
      
      queryObject.$or = searchConditions;
        
    }
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

  if (categoryIdsToQuery.length > 0) {
    const categoryQuery = { $in: categoryIdsToQuery }; // This array now contains ObjectIds

    if (queryObject.$or) {
      // If there's already an $or query (from title search), we need to use $and
      queryObject.$and = [
        { $or: queryObject.$or },
        { $or: [
          { category: categoryQuery },
          { categories: categoryQuery }
        ]}
      ];
      delete queryObject.$or;
    } else {
      queryObject.$or = [
        { category: categoryQuery },
        { categories: categoryQuery }
      ];
    }
  }

  // Debug log
  console.log('getAllProducts final queryObject:', JSON.stringify(queryObject));

  const pages = Number(page) || 1;
  const limits = Math.min(Number(limit) || 10, 50000); // Cap at 50,000 for customer app
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await Product.countDocuments(queryObject);

    const products = await Product.find(queryObject)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .populate({ path: "basicUnit", select: "_id name nameAr shortCode" })
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
      .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
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
      .populate({ path: "basicUnit", select: "_id name nameAr shortCode isParent" });

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
  const { category, title, slug, page, limit } = req.query; // Added page and limit
  const includeOutOfStock = String(req.query.include_out_of_stock || '').toLowerCase() === 'true';

  let queryObject = {};
  let sortObject = { _id: -1 }; // Default sort by latest

  let categoryIdsToQuery = [];
  if (category) {
    try {
      const categoryObjectId = new mongoose.Types.ObjectId(category);
      console.log(`🔍 getShowingStoreProducts: Converting category ID: ${category} to ObjectId: ${categoryObjectId}`);
      categoryIdsToQuery = await getAllChildCategoryIds(categoryObjectId);
      console.log(`🔍 getShowingStoreProducts: Final category IDs to query: ${categoryIdsToQuery.map(id => id.toString()).join(', ')}`);
    } catch (error) {
      console.error("Error in getShowingStoreProducts when converting category ID:", error);
      categoryIdsToQuery = [];
    }
  }

  // Base query conditions
  queryObject = {
    status: "show",
  };
  if (!includeOutOfStock) {
    queryObject.stock = { $gt: 0 };
  }

  if (title) {
    // Enhanced comprehensive search: search across multiple fields
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchTerm = title.trim();
    
    // Create regex patterns for different search strategies
    const exactMatch = { $regex: `^${escapeRegExp(searchTerm)}$`, $options: 'i' };
    const startsWithMatch = { $regex: `^${escapeRegExp(searchTerm)}`, $options: 'i' };
    const containsMatch = { $regex: escapeRegExp(searchTerm), $options: 'i' };
    
    // For multi-word searches, use lookahead pattern
    const words = searchTerm.split(/\s+/).filter(Boolean);
    const lookaheadPattern = words.map(w => `(?=.*${escapeRegExp(w)})`).join('');
    const multiWordMatch = { $regex: `${lookaheadPattern}.*`, $options: 'i' };

    queryObject.$or = [
      // Title searches (all languages including Arabic)
      { "title.en": exactMatch },
      { "title.en": startsWithMatch },
      { "title.en": containsMatch },
      { "title.en": multiWordMatch },
      { "title.ar": exactMatch },
      { "title.ar": startsWithMatch },
      { "title.ar": containsMatch },
      { "title.ar": multiWordMatch },
      { "title.es": exactMatch },
      { "title.es": startsWithMatch },
      { "title.es": containsMatch },
      { "title.es": multiWordMatch },
      { "title.fr": exactMatch },
      { "title.fr": startsWithMatch },
      { "title.fr": containsMatch },
      { "title.fr": multiWordMatch },
      { "title.de": exactMatch },
      { "title.de": startsWithMatch },
      { "title.de": containsMatch },
      { "title.de": multiWordMatch },
      
      // Name searches (fallback field)
      { "name": exactMatch },
      { "name": startsWithMatch },
      { "name": containsMatch },
      { "name": multiWordMatch },
      
      // Barcode and SKU searches (exact matches first)
      { "barcode": exactMatch },
      { "barcode": startsWithMatch },
      { "barcode": containsMatch },
      { "sku": exactMatch },
      { "sku": startsWithMatch },
      { "sku": containsMatch },
      { "default_code": exactMatch },
      { "default_code": startsWithMatch },
      { "default_code": containsMatch },
      
      // Product ID searches - only add _id search if it's a valid ObjectId
      ...(mongoose.Types.ObjectId.isValid(searchTerm) ? [{ "_id": searchTerm }] : []),
      
      // Slug searches
      { "slug": containsMatch },
      
      // Description searches
      { "description.en": containsMatch },
      { "description.ar": containsMatch },
      
      // Brand/Manufacturer searches
      { "brand": containsMatch },
      { "manufacturer": containsMatch },
      
      // Tags searches - use $in only for exact matches
      { "tags": containsMatch },
      
      // Category name searches (if populated)
      { "categoryName": containsMatch },
      
      // Product unit searches (if populated)
      { "productUnits.name": containsMatch },
      { "productUnits.shortCode": containsMatch }
    ];
  }

  if (slug) {
    queryObject.slug = slug;
  }

  if (categoryIdsToQuery.length > 0) {
    const categoryQuery = { $in: categoryIdsToQuery };
    if (queryObject.$or) {
      queryObject.$and = [
        { $or: queryObject.$or },
        { $or: [
          { category: categoryQuery },
          { categories: categoryQuery }
        ]}
      ];
      delete queryObject.$or;
    } else {
      queryObject.$or = [
        { category: categoryQuery },
        { categories: categoryQuery }
      ];
    }
    console.log(`🔍 getShowingStoreProducts: Added category query: ${JSON.stringify(queryObject.$or || queryObject.$and)}`);
  }

  console.log('🔍 getShowingStoreProducts final queryObject:', JSON.stringify(queryObject, null, 2));

  const pages = Number(page) || 1;
  const limits = Math.min(Number(limit) || 20, 50000); // Default limit 20, cap at 50000
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await Product.countDocuments(queryObject);
    console.log(`🔍 getShowingStoreProducts: Total documents found: ${totalDoc}`);

    const products = await Product.find(queryObject)
      .populate({ path: "category", select: "name _id" })
      .populate({ path: "categories", select: "name _id" })
      .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
      .sort(sortObject)
      .skip(skip)
      .limit(limits)
      .lean(); // Add lean() for performance if not modifying docs after query

    console.log(`🔍 getShowingStoreProducts: Products returned: ${products.length}`);
    if (products.length > 0) {
      console.log(`🔍 getShowingStoreProducts: Sample product categories:`, products.slice(0, 3).map(p => ({
        id: p._id,
        title: p.title?.en || p.title,
        category: p.category,
        categories: p.categories
      })));
    }

    // Get popular products (based on recent orders and sales)
    // First try to get products with sales > 0, if not enough, get recent products
    let popularProducts = await Product.find({
      status: "show",
      stock: { $gt: 0 },
      sales: { $gt: 0 }
    })
      .populate({ path: "category", select: "name _id" })
      .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
      .sort({ sales: -1 })
      .limit(20)
      .lean();

    // If we don't have enough popular products (less than 8), add recent products
    if (popularProducts.length < 8) {
      const recentProducts = await Product.find({
        status: "show",
        stock: { $gt: 0 },
        _id: { $nin: popularProducts.map(p => p._id) }
      })
        .populate({ path: "category", select: "name _id" })
        .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
        .sort({ createdAt: -1 })
        .limit(20 - popularProducts.length)
        .lean();

      popularProducts = [...popularProducts, ...recentProducts];
    }

    // Get discounted products
    const discountedProducts = await Product.find({
      status: "show",
      stock: { $gt: 0 },
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
      .populate({ path: "category", select: "name _id" })
      .populate({ path: "basicUnit", select: "name nameAr shortCode _id" })
      .sort({ _id: -1 })
      .limit(20)
      .lean();

    res.send({
      products,
      popularProducts,
      discountedProducts,
      totalDoc,
      pages,
      limits,
    });
  } catch (err) {
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
      .populate({ path: "basicUnit", select: "_id name nameAr shortCode" });

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
    }).populate('unit', '_id name nameAr shortCode');
    
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
          nameAr: unit.unit.nameAr,
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
      .populate({ path: "basicUnit", select: "name nameAr shortCode _id" });

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
    }).populate('unit', '_id name nameAr shortCode');
    
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
          nameAr: unit.unit.nameAr,
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

// Check if a category has products
const checkCategoryHasProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).send({ message: "Category ID is required" });
    }

    // Get all child category IDs for this category
    let categoryIdsToQuery = [];
    try {
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      categoryIdsToQuery = await getAllChildCategoryIds(categoryObjectId);
    } catch (error) {
      console.error("Error in checkCategoryHasProducts when converting category ID:", error);
      return res.status(400).send({ message: "Invalid category ID" });
    }

    // Query for products in this category or its subcategories
    // Remove stock restriction to show categories with products regardless of stock
    const queryObject = {
      status: "show",
      $or: [
        { category: { $in: categoryIdsToQuery } },
        { categories: { $in: categoryIdsToQuery } }
      ]
    };

    const count = await Product.countDocuments(queryObject);
    
    res.send({
      hasProducts: count > 0,
      productCount: count,
      categoryId: categoryId
    });
  } catch (err) {
    console.error("Error in checkCategoryHasProducts:", err.message);
    res.status(500).send({
      message: err.message,
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
  checkCategoryHasProducts,
};
