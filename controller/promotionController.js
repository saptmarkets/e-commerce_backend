const Promotion = require("../models/Promotion");
const Product = require("../models/Product");
const ProductUnit = require("../models/ProductUnit");

// Create a new promotion
const addPromotion = async (req, res) => {
  try {
    console.log('Creating promotion with data:', JSON.stringify(req.body, null, 2));

    const { type, productUnit, productUnits, categories, selectionMode, name } = req.body;

    // Validate based on promotion type
    if (type === 'fixed_price') {
      // Single product validation for fixed price
      if (!productUnit) {
        return res.status(400).send({
          message: "Product unit is required for fixed price promotions",
        });
      }

      const unit = await ProductUnit.findById(productUnit).populate('product');
      if (!unit) {
        return res.status(404).send({
          message: "Product unit not found",
        });
      }

      // Create promotion with product name if not provided
      const promotionData = {
        ...req.body,
        name: name || unit.product?.title?.en || "Fixed Price Offer",
        productUnits: [], // Clear multiple products for single product types
        categories: [], // Clear categories
        selectionMode: 'products', // Default to products
      };

      const newPromotion = new Promotion(promotionData);
      await newPromotion.save();

      res.status(201).send({
        message: "Promotion created successfully!",
        promotion: newPromotion,
      });

    } else if (type === 'bulk_purchase') {
      // Handle different selection modes for bulk purchases
      const mode = selectionMode || 'products';
      
      if (mode === 'all') {
        // All products mode - no specific products or categories needed
        const promotionData = {
          ...req.body,
          name: name || "Bulk Purchase Offer - All Products",
          productUnit: null,
          productUnits: [],
          categories: [],
          selectionMode: 'all',
        };

        const newPromotion = new Promotion(promotionData);
        await newPromotion.save();

        res.status(201).send({
          message: "Bulk promotion created successfully for all products!",
          promotion: newPromotion,
        });

      } else if (mode === 'categories') {
        // Categories mode
        if (!categories || categories.length === 0) {
          return res.status(400).send({
            message: "At least one category is required for category-based bulk promotions",
          });
        }

        const promotionData = {
          ...req.body,
          name: name || "Bulk Purchase Offer - Categories",
          productUnit: null,
          productUnits: [],
          categories: categories,
          selectionMode: 'categories',
        };

        const newPromotion = new Promotion(promotionData);
        await newPromotion.save();

        res.status(201).send({
          message: "Bulk promotion created successfully for categories!",
          promotion: newPromotion,
        });

      } else {
        // Products mode (default)
        if (!productUnit && (!productUnits || productUnits.length === 0)) {
          return res.status(400).send({
            message: "At least one product is required for product-based bulk promotions",
          });
        }

        let finalProductUnitIds = [];
        
        if (productUnit) {
          const unit = await ProductUnit.findById(productUnit).populate('product');
          if (!unit) {
            return res.status(404).send({
              message: "Product unit not found",
            });
          }
          finalProductUnitIds = [productUnit];
        } else if (productUnits && productUnits.length > 0) {
          finalProductUnitIds = productUnits;
        }

        const promotionData = {
          ...req.body,
          name: name || "Bulk Purchase Offer - Products",
          productUnits: finalProductUnitIds.length > 1 ? finalProductUnitIds : [],
          productUnit: finalProductUnitIds.length === 1 ? finalProductUnitIds[0] : null,
          categories: [],
          selectionMode: 'products',
        };

        const newPromotion = new Promotion(promotionData);
        await newPromotion.save();

        res.status(201).send({
          message: "Bulk promotion created successfully for products!",
          promotion: newPromotion,
        });
      }

    } else if (type === 'assorted_items') {
      // Multiple products validation
      if (!productUnits || productUnits.length === 0) {
        return res.status(400).send({
          message: "At least one product unit is required for assorted items promotion",
        });
      }

      // First, try to find existing ProductUnits
      const existingUnits = await ProductUnit.find({ _id: { $in: productUnits } }).populate('product');
      const existingUnitIds = existingUnits.map(unit => unit._id.toString());
      const missingIds = productUnits.filter(id => !existingUnitIds.includes(id.toString()));
      
      console.log(`Found ${existingUnits.length} existing units, ${missingIds.length} missing`);
      
      let finalProductUnitIds = existingUnitIds;

      // If some IDs are not ProductUnits, check if they are Product IDs and create ProductUnits
      if (missingIds.length > 0) {
        console.log('Missing product unit IDs:', missingIds);
        
        for (const id of missingIds) {
          try {
            // Check if this ID is a Product ID
            const product = await Product.findById(id).populate('basicUnit');
            if (product) {
              console.log(`Found product ${product.title?.en || product._id}, creating default ProductUnit`);
              
              // Get default unit ID (pieces/pcs)
              const Unit = require("../models/Unit");
              let defaultUnit = await Unit.findOne({ shortCode: 'pcs' }) || await Unit.findOne({ name: /piece/i });
              
              if (!defaultUnit) {
                // If no pcs unit exists, use the product's basic unit or create a default
                defaultUnit = product.basicUnit || await Unit.findOne().limit(1);
              }
              
              if (!defaultUnit) {
                console.error('No units found in system, cannot create ProductUnit');
                continue;
              }
              
              // Create ProductUnit for this product
              const newProductUnit = new ProductUnit({
                product: product._id,
                unit: defaultUnit._id,
                unitValue: 1,
                packQty: 1,
                price: product.price || 0,
                isDefault: true,
                isActive: true,
                title: `${defaultUnit.name} pack`,
                sku: product.sku || "",
                barcode: product.barcode || ""
              });
              
              await newProductUnit.save();
              finalProductUnitIds.push(newProductUnit._id.toString());
              console.log(`Created ProductUnit ${newProductUnit._id} for product ${product._id}`);
            } else {
              console.warn(`ID ${id} is neither a ProductUnit nor a Product`);
            }
          } catch (error) {
            console.error(`Error processing ID ${id}:`, error);
          }
        }
      }

      if (finalProductUnitIds.length === 0) {
        return res.status(404).send({
          message: "No valid product units could be found or created",
        });
      }
      
      // Update the productUnits array with the final IDs
      req.body.productUnits = finalProductUnitIds;

      // Create promotion with multiple products
      const promotionData = {
        ...req.body,
        name: name || "Mega Combo Deal",
        productUnit: null, // Clear single product for multiple products type
      };

      const newPromotion = new Promotion(promotionData);
      await newPromotion.save();

      res.status(201).send({
        message: "Promotion created successfully!",
        promotion: newPromotion,
      });

    } else {
      return res.status(400).send({
        message: "Invalid promotion type",
      });
    }

  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get all promotions with pagination
const getAllPromotions = async (req, res) => {
  const { page = 1, limit = 1000, status, promotionList } = req.query; // 🔥 FIXED: Increased default limit from 100 to 1000
  
  console.log('🔍 getAllPromotions called with params:', req.query);
  console.log('📊 Extracted params:', { page, limit, status, promotionList });
  
  try {
    const queryObject = {};
    
    // Add status filter if provided
    if (status) {
      queryObject.status = status;
    }
    
    // Add promotionList filter if provided
    if (promotionList) {
      queryObject.promotionList = promotionList;
      console.log('✅ Added promotionList filter:', promotionList);
    }
    
    console.log('🔍 Final query object:', queryObject);

    const count = await Promotion.countDocuments(queryObject);
    console.log('📊 Total promotions found in DB:', count);
    
    // 🔥 NEW: Validate and cap the limit to prevent performance issues
    const validatedLimit = Math.min(parseInt(limit), 5000); // Cap at 5000 for safety
    console.log('📊 Validated limit:', validatedLimit);
    
    const promotions = await Promotion.find(queryObject)
      .populate({
        path: 'productUnit',
        populate: [
          {
            path: 'product',
            select: 'title slug sku image prices stock description category brand'
          },
          {
            path: 'unit',
            select: 'name shortName nameAr'
          }
        ]
      })
      .populate({
        path: 'productUnits',
        populate: [
          {
            path: 'product',
            select: 'title slug sku image prices stock description category brand'
          },
          {
            path: 'unit',
            select: 'name shortName nameAr'
          }
        ]
      })
      .populate('categories', 'name description image')
      .populate('promotionList', 'name description type priority defaultValue')
      .sort({ createdAt: -1 })
      .limit(validatedLimit)
      .skip((parseInt(page) - 1) * validatedLimit);

    console.log('📊 Promotions returned after limit/skip:', promotions.length);
    console.log('📊 Limit applied:', validatedLimit);
    console.log('📊 Skip applied:', (parseInt(page) - 1) * validatedLimit);

    res.send({
      promotions,
      totalPages: Math.ceil(count / validatedLimit),
      currentPage: parseInt(page),
      totalPromotions: count,
    });
  } catch (err) {
    console.error('❌ Error in getAllPromotions:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get active promotions for store display
const getActivePromotions = async (req, res) => {
  try {
    const currentDate = new Date();
    console.log('Fetching active promotions at:', currentDate);
    
    // Get active promotions with enhanced population
    const promotionsQuery = {
      isActive: true,
    };
    
    const promotionsWithDates = await Promotion.find(promotionsQuery)
      .populate({
      path: 'productUnit',
      populate: [
        {
          path: 'product',
          select: 'title slug sku image prices stock'
        },
        {
          path: 'unit',
          select: 'name shortName nameAr'
        }
      ]
      })
      .populate({
      path: 'productUnits',
      populate: [
        {
          path: 'product',
          select: 'title slug sku image prices stock'
        },
        {
          path: 'unit',
          select: 'name shortName nameAr'
        }
        ],
        // Include stock and price fields from ProductUnit itself
        select: 'stock price product unit'
      })
      .populate('promotionList', 'name description type priority defaultValue');

    console.log(`Found ${promotionsWithDates.length} promotions with isActive=true`);

    // Enhanced debugging for productUnit population
    promotionsWithDates.forEach((promo, index) => {
      console.log(`Promotion ${index + 1} (${promo._id}):`, {
        type: promo.type,
        isActive: promo.isActive,
        hasProductUnit: !!promo.productUnit,
        productUnitId: promo.productUnit?._id,
        hasProduct: !!promo.productUnit?.product,
        productId: promo.productUnit?.product?._id,
        productTitle: promo.productUnit?.product?.title,
        startDate: promo.startDate,
        endDate: promo.endDate
      });
      
      // Debug assorted items promotions specifically
      if (promo.type === 'assorted_items' && promo.productUnits) {
        console.log(`🔍 Assorted promotion ${promo._id} productUnits:`, promo.productUnits.map(pu => ({
          id: pu._id,
          stock: pu.stock,
          price: pu.price,
          hasProduct: !!pu.product,
          productId: pu.product?._id
        })));
      }
      
      // Check for broken productUnit references
      if (promo.type === 'fixed_price' && !promo.productUnit) {
        console.warn(`⚠️ Fixed price promotion ${promo._id} has no productUnit!`);
      }
      
      if (promo.productUnit && !promo.productUnit.product) {
        console.warn(`⚠️ Promotion ${promo._id} has productUnit ${promo.productUnit._id} but no product!`);
      }
    });

    // Filter promotions with valid dates client-side for better control
    const validPromotions = promotionsWithDates.filter(promo => {
      // If no dates are set, consider it active
      if (!promo.startDate || !promo.endDate) return true;
      
      const start = new Date(promo.startDate);
      const end = new Date(promo.endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
      
      return start <= currentDate && end >= currentDate;
    });

    console.log(`Found ${validPromotions.length} active promotions after date filtering`);
    
    // Count promotions by type for debugging
    const promotionCounts = validPromotions.reduce((acc, promo) => {
      acc[promo.type] = (acc[promo.type] || 0) + 1;
      return acc;
    }, {});
    console.log('Promotion counts by type:', promotionCounts);
    
    // Count promotions with valid product data
    const fixedPriceWithProducts = validPromotions.filter(promo => 
      promo.type === 'fixed_price' && promo.productUnit && promo.productUnit.product
    ).length;
    console.log(`Fixed price promotions with valid product data: ${fixedPriceWithProducts}`);
    
    // Ensure we always return an array, even if empty
    res.status(200).json(validPromotions);
  } catch (err) {
    console.error('Error in getActivePromotions:', err);
    res.status(500).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
};

// Get a promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate({
        path: 'productUnit',
        populate: [
          {
            path: 'product',
            select: 'title slug sku image prices stock description category brand'
          },
          {
            path: 'unit',
            select: 'name shortName nameAr'
          }
        ]
      })
      .populate({
        path: 'productUnits',
        populate: [
          {
            path: 'product',
            select: 'title slug sku image prices stock description category brand'
          },
          {
            path: 'unit',
            select: 'name shortName nameAr'
          }
        ]
      })
      .populate('promotionList', 'name description type priority defaultValue');
      
    if (!promotion) {
      return res.status(404).send({
        message: "Promotion not found",
      });
    }
    
    res.send(promotion);
  } catch (err) {
    console.error('Error fetching promotion by ID:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get promotions by product unit ID
const getPromotionsByProductUnit = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const promotions = await Promotion.find({
      productUnit: req.params.productUnitId,
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate({
      path: 'productUnit',
      populate: [
        {
          path: 'product',
          select: 'title slug sku image prices stock description category brand'
        },
        {
          path: 'unit',
          select: 'name shortName nameAr'
        }
      ]
    }).populate('promotionList', 'name description type priority defaultValue');
    
    res.send(promotions);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get promotions by product ID
const getPromotionsByProduct = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // First find all product units for this product
    const productUnits = await ProductUnit.find({ product: req.params.productId });
    const productUnitIds = productUnits.map(unit => unit._id);
    
    const promotions = await Promotion.find({
      productUnit: { $in: productUnitIds },
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate({
      path: 'productUnit',
      populate: [
        {
          path: 'product',
          select: 'title slug sku image prices stock description category brand'
        },
        {
          path: 'unit',
          select: 'name shortName nameAr'
        }
      ]
    }).populate('promotionList', 'name description type priority defaultValue');
    
    res.send(promotions);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update a promotion
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).send({
        message: "Promotion not found",
      });
    }
    
    // Log the incoming data for debugging
    console.log('Updating promotion with data:', JSON.stringify(req.body, null, 2));
    
    // If productUnit is being changed, verify it exists
    if (req.body.productUnit && req.body.productUnit !== promotion.productUnit.toString()) {
      const productUnit = await ProductUnit.findById(req.body.productUnit).populate('product');
      if (!productUnit) {
        return res.status(404).send({
          message: "Product unit not found",
        });
      }
      
      // Update name if not provided
      if (!req.body.name) {
        req.body.name = productUnit.product?.title?.en || "Promotional Offer";
      }
    }
    
    const updatedPromotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'productUnit',
      populate: [
        {
          path: 'product',
          select: 'title slug sku image prices stock description category brand'
        },
        {
          path: 'unit',
          select: 'name shortName nameAr'
        }
      ]
    }).populate('promotionList', 'name description type priority defaultValue');
    
    res.send({
      message: "Promotion updated successfully!",
      promotion: updatedPromotion,
    });
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Delete a promotion
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    
    if (!promotion) {
      return res.status(404).send({
        message: "Promotion not found",
      });
    }

    // Clear the store_promotion_id in OdooPricelistItem
    const OdooPricelistItem = require("../models/OdooPricelistItem");
    await OdooPricelistItem.updateOne(
      { store_promotion_id: promotion._id },
      { $unset: { store_promotion_id: 1 }, $set: { _sync_status: 'pending', _import_error: null } }
    );
    
    res.send({
      message: "Promotion deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Delete multiple promotions
const deleteManyPromotions = async (req, res) => {
  try {
    if (!req.body.ids || !Array.isArray(req.body.ids)) {
      return res.status(400).send({
        message: "Promotion IDs are required",
      });
    }

    // Find promotions to get their IDs before deleting
    const promotionsToDelete = await Promotion.find({ _id: { $in: req.body.ids } });
    const promotionIdsToDelete = promotionsToDelete.map(promo => promo._id);
    
    await Promotion.deleteMany({ _id: { $in: req.body.ids } });

    // Clear the store_promotion_id in OdooPricelistItem for all deleted promotions
    const OdooPricelistItem = require("../models/OdooPricelistItem");
    await OdooPricelistItem.updateMany(
      { store_promotion_id: { $in: promotionIdsToDelete } },
      { $unset: { store_promotion_id: 1 }, $set: { _sync_status: 'pending', _import_error: null } }
    );
    
    res.send({
      message: "Promotions deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update promotion status
const updatePromotionStatus = async (req, res) => {
  try {
    if (!req.body.status) {
      return res.status(400).send({
        message: "Status is required",
      });
    }
    
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.status === 'active' },
      { new: true }
    );
    
    if (!promotion) {
      return res.status(404).send({
        message: "Promotion not found",
      });
    }
    
    res.send({
      message: `Promotion ${req.body.status} successfully!`,
      promotion,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addPromotion,
  getAllPromotions,
  getActivePromotions,
  getPromotionById,
  getPromotionsByProduct,
  getPromotionsByProductUnit,
  updatePromotion,
  deletePromotion,
  deleteManyPromotions,
  updatePromotionStatus,
};