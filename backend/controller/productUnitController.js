const ProductUnit = require("../models/ProductUnit");
const Product = require("../models/Product");
const Unit = require("../models/Unit");

// === PRODUCT UNIT CONTROLLER ===

// Get all product units (Admin only)
const getAllProductUnits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Increase default limit for promotion selection
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const filter = req.query.filter || {};
    const search = req.query.search || req.query.q || ''; // Support name-based search

    console.log('getAllProductUnits called with params:', { page, limit, search, filter });

    const query = {};
    
    // Basic filters
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    if (filter.productId) {
      query.$or = [
        { productId: filter.productId },
        { product: filter.productId }
      ];
    }

    // Name-based search - search in product title and unit name
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
      
      // First, find products that match the search term
      const matchingProducts = await Product.find({
        $or: [
          { 'title.en': searchRegex },
          { 'title': searchRegex },
          { 'slug': searchRegex }
        ]
      }).select('_id');
      
      const productIds = matchingProducts.map(p => p._id);
      
      // Then find units that match by unit name or belong to matching products
      const searchQuery = {
        $or: [
          { product: { $in: productIds } },
          { productId: { $in: productIds } }
        ]
      };
      
      // Combine with existing query
      if (Object.keys(query).length > 0) {
        query.$and = [query, searchQuery];
      } else {
        Object.assign(query, searchQuery);
      }
    }

    console.log('Query being executed:', JSON.stringify(query, null, 2));

    const productUnits = await ProductUnit.find(query)
      .populate('product', 'title slug images basicUnit')
      .populate('unit', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await ProductUnit.countDocuments(query);

    console.log(`Found ${productUnits.length} product units out of ${total} total`);

    // Format response for frontend consumption
    const formattedUnits = productUnits.map(unit => ({
      _id: unit._id,
      product: unit.product,
      unit: unit.unit,
      unitType: unit.unitType,
      unitValue: unit.unitValue,
      packQty: unit.packQty,
      price: unit.price,
      originalPrice: unit.originalPrice,
      sku: unit.sku,
      isActive: unit.isActive,
      createdAt: unit.createdAt,
      // Add computed fields for better display
      displayName: `${unit.product?.title?.en || unit.product?.title || 'Unknown Product'} - ${unit.unit?.name || unit.unitType || 'Unknown Unit'}`,
      pricePerBasicUnit: unit.pricePerBasicUnit
    }));

    res.status(200).json({
      success: true,
      data: formattedUnits,
      productUnits: formattedUnits, // Also provide in expected format for compatibility
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      searchTerm: search,
      totalCount: total
    });
  } catch (error) {
    console.error('Error in getAllProductUnits:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product units",
      error: error.message,
    });
  }
};

// Get units for a specific product
const getProductUnits = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId).populate('basicUnit');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productUnits = await ProductUnit.find({
      $or: [
        { productId },
        { product: productId }
      ],
      isActive: true
    })
    .populate('unit', 'name nameAr shortCode type isBase')  // Populate all unit fields including Arabic name
    .sort({ sortOrder: 1, unitValue: 1 });

    if (!productUnits || productUnits.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        basicProductUnit: null,
        count: 0,
      });
    }

    let basicProductUnitForComparison = null;
    if (product.basicUnit) {
        basicProductUnitForComparison = productUnits.find(pu => 
            pu.unit && 
            pu.unit._id.equals(product.basicUnit._id) && 
            pu.unitValue === 1
        );
    }
    if (!basicProductUnitForComparison) {
        basicProductUnitForComparison = productUnits.reduce((min, pu) => 
            (pu.totalBasicUnits < min.totalBasicUnits ? pu : min), productUnits[0]);
    }

    const unitsWithMetrics = productUnits.map(pu => {
      const unitData = pu.toObject();
      
      // Debug: Log unit data to see if nameAr is present
      console.log(`[ProductUnitController] Unit ${pu._id} - nameAr: "${pu.unit?.nameAr}" (hasNameAr: ${!!pu.unit?.nameAr})`);
      
      if (basicProductUnitForComparison && basicProductUnitForComparison.price > 0 && basicProductUnitForComparison._id.toString() !== pu._id.toString()) {
        unitData.savings = pu.calculateSavings(basicProductUnitForComparison.pricePerBasicUnit);
        const costIfBoughtAsBasic = basicProductUnitForComparison.pricePerBasicUnit * pu.totalBasicUnits;
        unitData.savingsPercent = costIfBoughtAsBasic > 0 ? Math.round((unitData.savings / costIfBoughtAsBasic) * 100) : 0;
      } else {
        unitData.savings = 0;
        unitData.savingsPercent = 0;
      }

      unitData.stockRequiredPerUnit = pu.totalBasicUnits;
      
      return unitData;
    });

    res.status(200).json({
      success: true,
      data: unitsWithMetrics,
      basicProductUnit: basicProductUnitForComparison ? basicProductUnitForComparison.toObject() : null,
      count: productUnits.length,
    });
  } catch (error) {
    console.error('Error in getProductUnits:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product units",
      error: error.message,
    });
  }
};

// Create a new unit for a product
const createProductUnit = async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log(`[ProductUnitController] Creating unit for product ${productId}`);
    console.log(`[ProductUnitController] Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`[ProductUnitController] Request headers:`, req.headers);
    
    const product = await Product.findById(productId);
    if (!product) {
      console.log(`[ProductUnitController] Product not found with ID: ${productId}`);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      unitId,
      unit,
      productId: reqProductId,  // Add support for productId
      unitType,
      unitValue = 1,
      packQty,
      price,
      originalPrice,
      sku,
      barcode,
      weight,
      dimensions,
      isDefault = false,
      minOrderQuantity = 1,
      maxOrderQuantity,
      costPrice = 0,
      title,
      description,
      attributes = {},
      status,
      sortOrder
    } = req.body;

    console.log(`[ProductUnitController] Extracted fields:`, {
      unitId,
      unit,
      reqProductId,
      unitValue,
      packQty,
      price,
      title
    });

    // Determine which fields to use - support both formats
    const finalProductId = productId;  // productId from URL params
    const finalUnitId = unitId || unit;  // Support both unitId and unit

    // Validate required fields
    const requiredFields = {
      'Unit ID': finalUnitId,
      'Pack Quantity': packQty,
      'Price': price
    };

    const missingFields = [];
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value && value !== 0) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      console.log(`[ProductUnitController] Missing required fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        receivedData: req.body
      });
    }
    
    if (!finalUnitId) {
      console.log(`[ProductUnitController] Unit ID is required.`);
      return res.status(400).json({ 
        success: false, 
        message: "Unit ID (unitId or unit) is required.",
        receivedData: req.body
      });
    }
    
    // Validate pack quantity
    const finalPackQty = parseFloat(packQty);
    if (isNaN(finalPackQty) || finalPackQty < 0.001) {
      console.log(`[ProductUnitController] Invalid pack quantity: ${packQty}`);
      return res.status(400).json({ 
        success: false, 
        message: "Pack quantity must be a number >= 0.001",
        receivedData: req.body
      });
    }
    
    // Validate price
    const finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      console.log(`[ProductUnitController] Invalid price: ${price}`);
      return res.status(400).json({ 
        success: false, 
        message: "Price must be a number >= 0",
        receivedData: req.body
      });
    }
    
    console.log(`[ProductUnitController] Looking for unit with ID: ${finalUnitId}`);
    const globalUnit = await Unit.findById(finalUnitId);
    if (!globalUnit) {
      console.log(`[ProductUnitController] Global unit definition not found for ID: ${finalUnitId}`);
      console.log(`[ProductUnitController] Available units:`, await Unit.find({}, '_id name').limit(10));
      return res.status(404).json({ 
        success: false, 
        message: `Global unit definition not found for ID: ${finalUnitId}`,
        providedUnitId: finalUnitId
      });
    }
    
    console.log(`[ProductUnitController] Found unit:`, globalUnit.name);
    
    // Check for duplicate units (same unit + pack quantity combination)
    const existingDuplicate = await ProductUnit.findOne({
      $or: [
        { product: finalProductId },
        { productId: finalProductId }
      ],
      unit: finalUnitId,
      packQty: finalPackQty
    });
    
    if (existingDuplicate) {
      console.log(`[ProductUnitController] Duplicate unit found:`, {
        unitName: globalUnit.name,
        packQty: finalPackQty,
        existingId: existingDuplicate._id
      });
      
      return res.status(409).json({
        success: false,
        message: `Duplicate unit detected: ${globalUnit.name} with pack quantity ${finalPackQty} already exists for this product`,
        duplicateUnit: {
          id: existingDuplicate._id,
          unitName: globalUnit.name,
          packQty: finalPackQty,
          existingPrice: existingDuplicate.price
        }
      });
    }
    
    console.log(`[ProductUnitController] No duplicate found, proceeding with creation`);
    
    // If this is the first unit being created for a product, ensure it inherits the product's basic price
    const existingUnitsCount = await ProductUnit.countDocuments({
      $or: [
        { product: finalProductId },
        { productId: finalProductId }
      ]
    });
    
    let adjustedPrice = finalPrice;
    let adjustedIsDefault = Boolean(isDefault);
    
    // If this is the first unit and no price was provided, use the product's basic price
    if (existingUnitsCount === 0 && finalPrice === 0) {
      console.log(`[ProductUnitController] First unit for product, checking product's basic price`);
      const productPrice = product.prices?.price || product.price;
      if (productPrice && productPrice > 0) {
        adjustedPrice = productPrice;
        adjustedIsDefault = true; // First unit should be default
        console.log(`[ProductUnitController] Using product's basic price: ${adjustedPrice}`);
      }
    }
    
    // Determine the unit type from the request or derive it from the global unit
    const finalUnitType = unitType || globalUnit.unitType || 'multi';
    
    // Create the product unit data
    const productUnitData = {
      product: finalProductId,  // Use 'product' as expected by the model
      unit: finalUnitId,   // Use 'unit' as expected by the model
      productId: finalProductId,  // Also include for compatibility
      unitId: finalUnitId,   // Also include for compatibility
      unitType: finalUnitType,
      unitValue: parseFloat(unitValue) || 1,
      packQty: finalPackQty,
      price: adjustedPrice,
      originalPrice: originalPrice ? parseFloat(originalPrice) : adjustedPrice,
      sku: sku || "",
      barcode: barcode || "",
      weight: weight ? parseFloat(weight) : 0,
      dimensions: dimensions || { length: 0, width: 0, height: 0 },
      isDefault: adjustedIsDefault,
      minOrderQuantity: parseInt(minOrderQuantity) || 1,
      maxOrderQuantity: maxOrderQuantity ? parseInt(maxOrderQuantity) : null,
      costPrice: parseFloat(costPrice) || 0,
      title: title || `${globalUnit.name} pack`,
      description: description || "",
      attributes: attributes || {},
      isActive: status !== 'hide',
      isAvailable: true,
      sortOrder: parseInt(sortOrder) || 0
    };
    
    console.log(`[ProductUnitController] Final product unit data:`, JSON.stringify(productUnitData, null, 2));
    
    try {
      const productUnit = new ProductUnit(productUnitData);
      console.log(`[ProductUnitController] Created ProductUnit instance, attempting to save...`);
      
      const savedProductUnit = await productUnit.save();
      console.log(`[ProductUnitController] Successfully saved product unit:`, savedProductUnit._id);
    
      res.status(201).json({
        success: true,
        message: "Product unit created successfully",
        data: savedProductUnit,
      });
    } catch (saveError) {
      console.error(`[ProductUnitController] Error saving product unit:`, saveError);
      console.error(`[ProductUnitController] Validation errors:`, saveError.errors);
      
      return res.status(500).json({
        success: false,
        message: "Error saving product unit to database",
        error: saveError.message,
        validationErrors: saveError.errors,
        attemptedData: productUnitData
      });
    }
  } catch (error) {
    console.error(`[ProductUnitController] Unexpected error in createProductUnit:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to create product unit",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a specific product unit
const updateProductUnit = async (req, res) => {
  try {
    const { productId, unitId: productUnitDocId } = req.params;
    
    const productUnitToUpdate = await ProductUnit.findOne({
      _id: productUnitDocId,
      $or: [
        { productId },
        { product: productId }
      ]
    });

    if (!productUnitToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Product unit not found",
      });
    }

    const {
      unitId,
      unitValue,
      price,
      originalPrice,
      sku,
      barcode,
      weight,
      dimensions,
      isDefault,
      minOrderQuantity,
      maxOrderQuantity,
      costPrice,
      title,
      description,
      attributes,
      status,
      sortOrder
    } = req.body;

    if (unitId) {
      const globalUnit = await Unit.findById(unitId);
      if (!globalUnit) {
        return res.status(404).json({ success: false, message: "Global unit definition not found." });
      }
      productUnitToUpdate.unitId = unitId;
    }

    if (unitValue !== undefined) productUnitToUpdate.unitValue = unitValue;
    
    if ( (unitId && !productUnitToUpdate.unitId.equals(unitId)) || (unitValue !== undefined && productUnitToUpdate.unitValue !== unitValue) ) {
        const checkUnitId = unitId || productUnitToUpdate.unitId;
        const checkUnitValue = unitValue !== undefined ? unitValue : productUnitToUpdate.unitValue;
        const existingDuplicate = await ProductUnit.findOne({
            $and: [
              {
                $or: [
                  { productId },
                  { product: productId }
                ]
              },
              {
                $or: [
                  { unitId: checkUnitId },
                  { unit: checkUnitId }
                ]
              }
            ],
            unitValue: checkUnitValue,
            _id: { $ne: productUnitDocId },
            isActive: true,
        });
        if (existingDuplicate) {
            const unitName = (await Unit.findById(checkUnitId))?.name || 'selected unit';
            return res.status(400).json({
                success: false,
                message: `Another product unit with Unit "${unitName}" and value "${checkUnitValue}" already exists for this product.`,
            });
        }
    }

    if (price !== undefined) productUnitToUpdate.price = price;
    productUnitToUpdate.originalPrice = (originalPrice !== undefined) ? originalPrice : productUnitToUpdate.price;
    
    if (sku !== undefined) {
      productUnitToUpdate.sku = sku;
    }

    if (barcode && barcode !== productUnitToUpdate.barcode) {
      const existingBarcode = await ProductUnit.findOne({ barcode, _id: { $ne: productUnitDocId }, isActive: true });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: "Barcode already exists." });
      }
      productUnitToUpdate.barcode = barcode;
    }

    if (weight !== undefined) productUnitToUpdate.weight = weight;
    if (dimensions !== undefined) productUnitToUpdate.dimensions = dimensions;
    if (isDefault !== undefined) productUnitToUpdate.isDefault = isDefault;
    if (minOrderQuantity !== undefined) productUnitToUpdate.minOrderQuantity = minOrderQuantity;
    if (maxOrderQuantity !== undefined) productUnitToUpdate.maxOrderQuantity = maxOrderQuantity;
    if (costPrice !== undefined) productUnitToUpdate.costPrice = costPrice;
    if (title !== undefined) productUnitToUpdate.title = title;
    if (description !== undefined) productUnitToUpdate.description = description;
    if (attributes !== undefined) productUnitToUpdate.attributes = attributes;
    if (sortOrder !== undefined) productUnitToUpdate.sortOrder = sortOrder;

    if (status !== undefined) {
        productUnitToUpdate.isActive = (status === 'show');
    }

    await productUnitToUpdate.save();

    const productUnitsCount = await ProductUnit.countDocuments({ 
      $or: [
        { productId },
        { product: productId }
      ], 
      isActive: true 
    });
    let productUpdatePayload = { hasMultiUnits: productUnitsCount > 0 };
    
    // Get distinct unit IDs from both field formats
    const distinctUnitIds = await ProductUnit.distinct('unit', { 
      $or: [
        { productId },
        { product: productId }
      ], 
      isActive: true 
    });
    productUpdatePayload.availableUnits = distinctUnitIds.map(id => id.toString());
    await Product.findByIdAndUpdate(productId, productUpdatePayload);

    const populatedUnit = await ProductUnit.findById(productUnitDocId)
      .populate('product', 'title slug images basicUnit')
      .populate('unit');

    res.status(200).json({
      success: true,
      message: "Product unit updated successfully",
      data: populatedUnit,
    });
  } catch (error) {
    console.error('Error in updateProductUnit:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update product unit",
      error: error.message,
    });
  }
};

// Delete a specific product unit
const deleteProductUnit = async (req, res) => {
  try {
    const { productId, unitId: productUnitDocId } = req.params; // unitId here is the ProductUnit document ID

    const unitToDelete = await ProductUnit.findOneAndDelete({
      _id: productUnitDocId,
      $or: [
        { productId: productId },
        { product: productId }
      ]
    });

    if (!unitToDelete) {
      return res.status(404).json({
        success: false,
        message: "Product unit not found or does not belong to the specified product.",
      });
    }

    // Update product flags (hasMultiUnits, availableUnits)
    const remainingUnits = await ProductUnit.find({ 
      $or: [
        { productId: productId },
        { product: productId }
      ], 
      isActive: true 
    });
    let productUpdatePayload = { hasMultiUnits: remainingUnits.length > 0 };

    if (remainingUnits.length > 0) {
      const distinctUnitIds = await ProductUnit.distinct('unit', { 
        $or: [
          { productId: productId },
          { product: productId }
        ], 
        isActive: true 
      });
      productUpdatePayload.availableUnits = distinctUnitIds.map(id => id.toString());
    } else {
      productUpdatePayload.availableUnits = []; // No active units left
    }
    
    await Product.findByIdAndUpdate(productId, productUpdatePayload);

    res.status(200).json({
      success: true,
      message: "Product unit deleted successfully",
      data: { deletedUnitId: productUnitDocId },
    });
  } catch (error) {
    console.error('Error in deleteProductUnit:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product unit",
      error: error.message,
    });
  }
};

// Calculate stock requirement for a given product unit and quantity
// This route might be redundant if client can use ProductUnit.totalBasicUnits directly after fetching
const calculateStockRequirement = async (req, res) => {
  try {
    const { productUnitId, quantity = 1 } = req.body;
    if (!productUnitId) {
      return res.status(400).json({ success: false, message: "productUnitId is required." });
    }

    const productUnit = await ProductUnit.findById(productUnitId).populate('unit');
    if (!productUnit) {
      return res.status(404).json({ success: false, message: "Product unit not found." });
    }

    // Use the static method from the model, or the virtual property
    // const requiredStock = ProductUnit.getStockRequirement(productUnit, parseInt(quantity)); // static method call
    const requiredStock = productUnit.totalBasicUnits * parseInt(quantity); // using virtual property

    res.status(200).json({
      success: true,
      data: {
        productUnitId,
        requestedQuantity: parseInt(quantity),
        requiredBasicUnits: requiredStock,
        unitName: productUnit.unit ? productUnit.unit.name : 'N/A',
        unitPackValue: productUnit.unit ? productUnit.unit.packValue : 'N/A',
        productUnitValue: productUnit.unitValue
      },
    });
  } catch (error) {
    console.error('Error in calculateStockRequirement:', error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate stock requirement",
      error: error.message,
    });
  }
};

// Get the best value unit for a product
const getBestValueUnit = async (req, res) => {
  try {
    const { productId } = req.params;
    const productUnits = await ProductUnit.find({ 
      $or: [
        { productId: productId },
        { product: productId }
      ], 
      isActive: true, 
      // isAvailable: true // Assuming isActive means available for sale
    }).populate('unit');

    if (!productUnits || productUnits.length === 0) {
      return res.status(404).json({ success: false, message: "No active units found for this product." });
    }

    // Sort by pricePerBasicUnit (virtual property)
    // The virtual property handles cases where unitId or packValue might not be set, returning price as fallback.
    const sortedUnits = productUnits.sort((a, b) => a.pricePerBasicUnit - b.pricePerBasicUnit);
    
    res.status(200).json({
      success: true,
      data: sortedUnits[0], // The first one is the best value
    });
  } catch (error) {
    console.error('Error in getBestValueUnit:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get best value unit",
      error: error.message,
    });
  }
};

// Compare pricing for all units of a product
const compareUnitPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('basicUnit');
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productUnits = await ProductUnit.find({ 
      $or: [
        { productId: productId },
        { product: productId }
      ], 
      isActive: true 
    })
      .populate('unit')
      .sort({ 'unit.packValue': 1, unitValue: 1 });

    if (!productUnits || productUnits.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "No active units to compare." });
    }
    
    let basicProductUnitPricePerBasicItem = null;
    if (product.basicUnit) {
        const basicPU = productUnits.find(pu => pu.unit && pu.unit._id.equals(product.basicUnit._id) && pu.unitValue === 1);
        if (basicPU) {
            basicProductUnitPricePerBasicItem = basicPU.pricePerBasicUnit;
        }
    }
    // Fallback if no direct basic product unit price found, try the smallest unit's price per basic item
    if (basicProductUnitPricePerBasicItem === null && productUnits.length > 0) {
        const sortedByTotalBasic = [...productUnits].sort((a,b) => a.totalBasicUnits - b.totalBasicUnits);
        basicProductUnitPricePerBasicItem = sortedByTotalBasic[0].pricePerBasicUnit;
    }

    const comparisonResults = productUnits.map(pu => {
      const puObject = pu.toObject(); // Get plain object
      puObject.pricePerBasicUnit = pu.pricePerBasicUnit; // Ensure virtual is included
      puObject.totalBasicUnitsInPackage = pu.totalBasicUnits; // Ensure virtual is included
      puObject.savingsComparedToBasic = 0;
      puObject.savingsPercent = 0;

      if (basicProductUnitPricePerBasicItem !== null && basicProductUnitPricePerBasicItem > 0) {
        if (pu.pricePerBasicUnit < basicProductUnitPricePerBasicItem) {
            const costIfBoughtAsBasic = basicProductUnitPricePerBasicItem * pu.totalBasicUnits;
            puObject.savingsComparedToBasic = costIfBoughtAsBasic - pu.price;
            puObject.savingsPercent = costIfBoughtAsBasic > 0 ? Math.round( (puObject.savingsComparedToBasic / costIfBoughtAsBasic) * 100) : 0;
        }
      }
      return puObject;
    });

    res.status(200).json({
      success: true,
      data: comparisonResults,
      baselinePricePerBasicItem: basicProductUnitPricePerBasicItem
    });
  } catch (error) {
    console.error('Error in compareUnitPricing:', error);
    res.status(500).json({
      success: false,
      message: "Failed to compare unit pricing",
      error: error.message,
    });
  }
};

// Validate unit data before saving (e.g., for admin panel checks)
const validateUnitData = async (req, res) => {
  try {
    const { productId, unitId, unitValue, price, sku, barcode } = req.body; // Changed inputs
    const productUnitDocId = req.body.productUnitDocId; // Optional: for distinguishing during update

    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!productId || !unitId || unitValue === undefined || price === undefined) {
      validation.isValid = false;
      validation.errors.push("ProductId, unitId, unitValue, and price are required for validation.");
      return res.status(400).json({ success: false, data: validation });
    }
    
    const product = await Product.findById(productId).populate('basicUnit');
    if (!product) {
      validation.isValid = false;
      validation.errors.push("Product not found.");
      // No further checks if product doesn't exist
      return res.status(404).json({ success: false, data: validation, message: "Product not found." });
    }

    const globalUnit = await Unit.findById(unitId);
    if (!globalUnit) {
      validation.isValid = false;
      validation.errors.push("Global unit definition (unitId) not found.");
      // No further checks if unit definition doesn't exist
       return res.status(404).json({ success: false, data: validation, message: "Unit definition not found." });
    }

    // Check for duplicate ProductUnit (productId, unitId, unitValue)
    const duplicateCheckQuery = {
      productId,
      unitId,
      unitValue,
      isActive: true, 
    };
    if (productUnitDocId) {
      duplicateCheckQuery._id = { $ne: productUnitDocId };
    }
    const existingUnit = await ProductUnit.findOne(duplicateCheckQuery);

    if (existingUnit) {
      validation.isValid = false;
      validation.errors.push(`Product unit with Unit "${globalUnit.name}" and value "${unitValue}" already exists.`);
    }

    if (parseFloat(unitValue) <= 0) {
        validation.isValid = false;
        validation.errors.push("Unit value must be greater than 0.");
    }

    if (parseFloat(price) <= 0) {
      validation.isValid = false;
      validation.errors.push("Price must be greater than 0.");
    }

    // SKU and Barcode uniqueness checks (optional inputs)
    if (sku) {
      const skuCheckQuery = { sku, isActive: true };
      if (productUnitDocId) skuCheckQuery._id = { $ne: productUnitDocId };
      const existingSku = await ProductUnit.findOne(skuCheckQuery);
      if (existingSku) {
        validation.isValid = false;
        validation.errors.push("SKU already exists.");
      }
    }
    if (barcode) {
      const barcodeCheckQuery = { barcode, isActive: true };
      if (productUnitDocId) barcodeCheckQuery._id = { $ne: productUnitDocId };
      const existingBarcode = await ProductUnit.findOne(barcodeCheckQuery);
      if (existingBarcode) {
        validation.isValid = false;
        validation.errors.push("Barcode already exists.");
      }
    }

    // Price comparison warning (if this unit is more expensive per basic item than the product's basic selling unit)
    if (product.basicUnit && globalUnit._id.toString() !== product.basicUnit._id.toString() ) {
        // Find the ProductUnit that represents the product's actual basic selling form
        const basicSellingPU = await ProductUnit.findOne({ 
            productId, 
            unitId: product.basicUnit._id, 
            unitValue: 1, // Assuming basic selling form is unitValue 1 of the product.basicUnit
            isActive: true 
        }).populate('unit');

        if (basicSellingPU && basicSellingPU.price > 0) {
            const currentPU_TotalBasicUnits = parseFloat(unitValue) * globalUnit.packValue;
            const currentPU_PricePerBasicUnit = parseFloat(price) / currentPU_TotalBasicUnits;

            if (currentPU_PricePerBasicUnit > basicSellingPU.pricePerBasicUnit) {
                validation.warnings.push(
                `Price per basic item for this unit (${currentPU_PricePerBasicUnit.toFixed(2)}) is higher than the product's standard basic unit price (${basicSellingPU.pricePerBasicUnit.toFixed(2)}).`
                );
            }
        } else if (!basicSellingPU && globalUnit.packValue > 1) {
            validation.warnings.push("Cannot compare price effectively: Product's basic selling unit form not found or has no price. Ensure a ProductUnit exists for the Product's specified basicUnit with unitValue 1.");
        }
    }

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Error in validateUnitData:', error);
    res.status(500).json({
      success: false,
      message: "Failed to validate unit data",
      error: error.message,
    });
  }
};

// Simple validation helper
const validateRequired = (fields, data) => {
  const errors = [];
  fields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

module.exports = {
  getAllProductUnits,
  getProductUnits,
  createProductUnit,
  updateProductUnit,
  deleteProductUnit,
  calculateStockRequirement,
  getBestValueUnit,
  compareUnitPricing,
  validateUnitData,
}; 