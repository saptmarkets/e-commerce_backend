// Verification code generator utility
const Product = require("../../models/Product");
const ProductUnit = require("../../models/ProductUnit");
const Unit = require("../../models/Unit");
const mongoose = require('mongoose');

class VerificationCodeGenerator {
  
  // Generate a random 6-digit verification code
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Generate a more secure alphanumeric code
  static generateAlphanumericCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Generate a code with specific format (e.g., ABC-123)
  static generateFormattedCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let letterPart = '';
    let numberPart = '';
    
    // Generate 3 letters
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 3 numbers
    for (let i = 0; i < 3; i++) {
      numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return `${letterPart}-${numberPart}`;
  }
  
  // Validate verification code format
  static isValidCode(code) {
    if (!code || typeof code !== 'string') return false;
    
    // Check for 6-digit numeric code
    if (/^\d{6}$/.test(code)) return true;
    
    // Check for alphanumeric code
    if (/^[A-Z0-9]{6}$/.test(code)) return true;
    
    // Check for formatted code (ABC-123)
    if (/^[A-Z]{3}-\d{3}$/.test(code)) return true;
    
    return false;
  }
  
  // Enhanced function to get product unit information using unit ID
  static async getProductUnitById(unitId) {
    try {
    
      
      const productUnit = await ProductUnit.findById(unitId)
        .populate('product', 'title description images sku barcode')
        .populate('unit', 'name shortCode type');
      
      if (productUnit) {
        // Determine the best title to use - prioritize Product title over ProductUnit title
        let bestTitle = 'Unknown Product';
        let arabicTitle = '';
        let englishTitle = '';
        
        // Extract both Arabic and English titles from product data
        if (productUnit.product?.title) {
          if (typeof productUnit.product.title === 'object') {
            // Product has dual-language titles
            englishTitle = productUnit.product.title.en || '';
            arabicTitle = productUnit.product.title.ar || '';
            
            // Use English as primary, fallback to Arabic if English missing
            bestTitle = englishTitle || arabicTitle || Object.values(productUnit.product.title)[0] || 'Unknown Product';
            
            console.log(`✅ Found dual-language titles: Arabic="${arabicTitle}", English="${englishTitle}"`);
          } else if (typeof productUnit.product.title === 'string') {
            // Product has single language title
            bestTitle = productUnit.product.title;
            englishTitle = productUnit.product.title;
            arabicTitle = productUnit.product.title;
            console.log(`⚠️ Product has single language title: "${bestTitle}"`);
          }
        } else if (productUnit.title && !productUnit.title.startsWith('Unit for') && !productUnit.title.includes('pack')) {
          // Fallback to ProductUnit title
          bestTitle = productUnit.title;
          englishTitle = productUnit.title;
          arabicTitle = productUnit.title;
          console.log(`⚠️ Using ProductUnit title as fallback: "${bestTitle}"`);
        }

        console.log(`✅ Found ProductUnit: ${bestTitle} - ${productUnit.unit?.name || 'No unit name'}`);
        return {
          _id: productUnit._id,
          title: [arabicTitle, englishTitle], // 🔴 Return both languages in array format
          unitName: productUnit.unit?.name || 'Unit',
          packQty: productUnit.packQty || 1,
          price: productUnit.price || 0,
          originalPrice: productUnit.originalPrice || productUnit.price || 0,
          description: productUnit.description || productUnit.product?.description?.en || '',
          sku: productUnit.sku || productUnit.product?.sku || '',
          barcode: productUnit.barcode || productUnit.product?.barcode || '',
          arabicTitle: arabicTitle,
          englishTitle: englishTitle,
          images: productUnit.images?.length > 0 ? productUnit.images : (productUnit.product?.images || []),
          attributes: productUnit.attributes || {},
          weight: productUnit.weight || 0,
          dimensions: productUnit.dimensions || {},
          unitId: productUnit._id,
          unitType: productUnit.unitType || 'multi',
          unitValue: productUnit.unitValue || 1,
          costPrice: productUnit.costPrice || 0,
          minOrderQuantity: productUnit.minOrderQuantity || 1,
          maxOrderQuantity: productUnit.maxOrderQuantity,
          tags: productUnit.tags || [],
          bulkPricing: productUnit.bulkPricing || [],
          productId: productUnit.product?._id || productUnit.product
        };
      } else {
        console.log(`[DEBUG] getProductUnitById: ProductUnit not found for ID: ${unitId}`);
        return null;
      }
    } catch (error) {
      console.error(`[DEBUG] getProductUnitById: Error getting ProductUnit by ID ${unitId}:`, error.message);
      return null;
    }
  }

  // Generate enhanced product checklist using unit IDs
  static async generateProductChecklist(order) {
    try {
      console.log('[DEBUG] generateProductChecklist: Starting for order:', order.invoice);
      
      if (!order.cart || order.cart.length === 0) {
        console.log('[DEBUG] generateProductChecklist: No cart items found');
        return [];
      }
    
      const checklist = [];
    
      for (const item of order.cart) {
        try {
          console.log('[DEBUG] generateProductChecklist: Processing cart item:', JSON.stringify(item, null, 2));

          let checklistItem = {
            productId: item.id || item.productId,
            title: item.title || 'Unknown Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            originalPrice: item.originalPrice || item.price || 0,
            image: item.image,
            collected: false,
            notes: '',
            collectedAt: null,
            collectedBy: null,
            
            // Multi-unit information from cart item (fallback)
            unitName: item.unitName || 'Unit',
            packQty: item.packQty || 1,
            unitId: item.selectedUnitId || item.unitId,
            selectedUnitId: item.selectedUnitId || item.unitId,
            unitType: item.unitType || 'multi',
            unitValue: item.unitValue || 1,
            
            // Product details (fallback)
            description: item.description || '',
            sku: item.sku || '',
            barcode: item.barcode || '',
            arabicTitle: item.arabicTitle || '',
            images: Array.isArray(item.image) ? item.image : [item.image].filter(Boolean),
            attributes: item.attributes || {},
            weight: item.weight || 0,
            dimensions: item.dimensions || {},
            tags: item.tags || []
          };

          // If we have a selectedUnitId, get the EXACT ProductUnit data
          if (item.selectedUnitId) {
            console.log(`[DEBUG] generateProductChecklist: Using selectedUnitId: ${item.selectedUnitId} to get exact ProductUnit data`);
            const productUnitData = await this.getProductUnitById(item.selectedUnitId);
            
            if (productUnitData) {
              // Override ALL data with the exact ProductUnit data
              checklistItem = {
                ...checklistItem,
                title: productUnitData.title,
                unitName: productUnitData.unitName,
                packQty: productUnitData.packQty,
                price: productUnitData.price,
                originalPrice: productUnitData.originalPrice,
                description: productUnitData.description,
                sku: productUnitData.sku,
                barcode: productUnitData.barcode,
                arabicTitle: productUnitData.arabicTitle,
                englishTitle: productUnitData.englishTitle,
                images: productUnitData.images,
                attributes: productUnitData.attributes,
                weight: productUnitData.weight,
                dimensions: productUnitData.dimensions,
                unitId: productUnitData.unitId,
                selectedUnitId: productUnitData.unitId,
                unitType: productUnitData.unitType,
                unitValue: productUnitData.unitValue,
                costPrice: productUnitData.costPrice,
                minOrderQuantity: productUnitData.minOrderQuantity,
                maxOrderQuantity: productUnitData.maxOrderQuantity,
                tags: productUnitData.tags,
                bulkPricing: productUnitData.bulkPricing,
                productId: productUnitData.productId || item.id
              };
              
              console.log(`[DEBUG] generateProductChecklist: Updated item with ProductUnit data: ${checklistItem.title}`);
            } else {
              console.log(`[DEBUG] generateProductChecklist: Could not find ProductUnit for ID: ${item.selectedUnitId}, trying to fetch product data directly...`);
              
              // Try to fetch product data directly if ProductUnit not found
              try {
                const Product = require("../../models/Product");
                const product = await Product.findById(item.productId || item.id);
                
                if (product && product.title) {
                  let arabicTitle = '';
                  let englishTitle = '';
                  
                  if (typeof product.title === 'object') {
                    arabicTitle = product.title.ar || '';
                    englishTitle = product.title.en || '';
                  } else if (typeof product.title === 'string') {
                    arabicTitle = product.title;
                    englishTitle = product.title;
                  }
                  
                  checklistItem.title = [arabicTitle, englishTitle];
                  checklistItem.arabicTitle = arabicTitle;
                  checklistItem.englishTitle = englishTitle;
                  
                  console.log(`[DEBUG] generateProductChecklist: Fetched product data directly: Arabic="${arabicTitle}", English="${englishTitle}"`);
                }
              } catch (productError) {
                console.warn(`[DEBUG] generateProductChecklist: Could not fetch product data:`, productError.message);
              }
            }
          } else {
            console.log(`[DEBUG] generateProductChecklist: No selectedUnitId found for item: ${item.title}, using cart data only`);
          }

          // Ensure title is always in array format [arabicTitle, englishTitle]
          if (!Array.isArray(checklistItem.title)) {
            // If title is a string, convert to array format
            if (typeof checklistItem.title === 'string') {
              checklistItem.title = [checklistItem.title, checklistItem.title]; // [title, title] for fallback
            } else {
              checklistItem.title = ['Unknown Product', 'Unknown Product']; // Default fallback
            }
          }
          
          // Ensure we have both arabicTitle and englishTitle fields
          if (!checklistItem.arabicTitle) {
            checklistItem.arabicTitle = checklistItem.title[0] || 'Unknown Product';
          }
          if (!checklistItem.englishTitle) {
            checklistItem.englishTitle = checklistItem.title[1] || checklistItem.title[0] || 'Unknown Product';
          }

          // Calculate pricing information
          checklistItem.unitPrice = checklistItem.price;
          checklistItem.totalPrice = checklistItem.price * checklistItem.quantity;
          checklistItem.pricePerBaseUnit = checklistItem.packQty > 0 ? checklistItem.price / checklistItem.packQty : checklistItem.price;
          
          // Multi-unit display calculations
          const totalPieces = checklistItem.quantity * checklistItem.packQty;
          
          // Unit calculation for display - enhanced for multi-unit
          if (checklistItem.packQty > 1) {
            checklistItem.unitCalculation = `${checklistItem.quantity} × ${checklistItem.unitName} (${checklistItem.packQty} pcs per ${checklistItem.unitName})`;
            checklistItem.displayQuantity = `${checklistItem.quantity} × ${checklistItem.unitName}`;
            checklistItem.displayUnit = `${checklistItem.unitName} (${checklistItem.packQty} pcs)`;
            checklistItem.totalPieces = totalPieces;
            checklistItem.pieceCalculation = `${totalPieces} total pcs`;
          } else {
            checklistItem.unitCalculation = `${checklistItem.quantity} × ${checklistItem.unitName}`;
            checklistItem.displayQuantity = `${checklistItem.quantity} pcs`;
            checklistItem.displayUnit = checklistItem.unitName;
            checklistItem.totalPieces = checklistItem.quantity;
            checklistItem.pieceCalculation = `${checklistItem.quantity} pcs`;
          }
          
          // Price per piece for display
          checklistItem.pricePerPiece = checklistItem.pricePerBaseUnit;
          checklistItem.pricePerPieceDisplay = `${checklistItem.pricePerBaseUnit.toFixed(2)}/pc`;
          
          // Combo product information
          checklistItem.isCombo = item.isCombo || false;
          checklistItem.comboDetails = item.comboDetails || null;

          checklist.push(checklistItem);
          console.log('[DEBUG] generateProductChecklist: Added item to checklist:', {title: checklistItem.title, unit: checklistItem.unitName, price: checklistItem.price});
          console.log('   Display:', checklistItem.displayQuantity, 'Total pieces:', checklistItem.totalPieces);
          
        } catch (itemError) {
          console.error('[DEBUG] generateProductChecklist: Error processing cart item:', item.id, itemError);
          // Add basic item even if enhancement fails
          checklist.push({
            productId: item.id,
            title: item.title || 'Unknown Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            originalPrice: item.originalPrice || item.price || 0,
            image: item.image,
            collected: false,
            notes: '',
            collectedAt: null,
            collectedBy: null,
            unitName: item.unitName || 'Unit',
            packQty: item.packQty || 1,
            unitCalculation: `${item.quantity || 1} × ${item.unitName || 'Unit'}`,
            displayQuantity: `${item.quantity || 1} × ${item.unitName || 'Unit'}`,
            totalPrice: (item.price || 0) * (item.quantity || 1),
            unitPrice: item.price || 0,
            pricePerBaseUnit: item.packQty > 0 ? (item.price || 0) / item.packQty : (item.price || 0),
            totalPieces: (item.quantity || 1) * (item.packQty || 1),
            images: Array.isArray(item.image) ? item.image : [item.image].filter(Boolean),
            description: '',
            sku: '',
            barcode: '',
            arabicTitle: '',
            attributes: {},
            weight: 0,
            dimensions: {},
            selectedUnitId: item.selectedUnitId || item.unitId,
            unitId: item.selectedUnitId || item.unitId
          });
        }
      }
      
      console.log('[DEBUG] generateProductChecklist: Final checklist generated with', checklist.length, 'items.');
      return checklist;
      
    } catch (error) {
      console.error("[DEBUG] generateProductChecklist: A critical error occurred", error);
      return []; // Return empty on critical failure
    }
  }
}

module.exports = VerificationCodeGenerator; 