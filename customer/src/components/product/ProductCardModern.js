import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoHeartOutline,
  IoHeart,
  IoStarSharp,
  IoFlashOutline,
  IoCheckmarkCircle,
  IoEyeOutline
} from "react-icons/io5";
import useTranslation from 'next-translate/useTranslation';
import { useCart } from "react-use-cart";

// Internal imports
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";
import ProductUnitServices from "@services/ProductUnitServices";
import PromotionServices from "@services/PromotionServices";
import { getUnitDisplayName, getShortUnitName, getBilingualUnitDisplay } from "@utils/unitUtils";

const ProductCardModern = ({ 
  product, 
  attributes = [], 
  className = "",
  showQuantitySelector = true,
  showFavorite = true,
  compact = false,
  promotion = null
}) => {
  // State management
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { t } = useTranslation('common');
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [activePromotion, setActivePromotion] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasCheckedPromotions, setHasCheckedPromotions] = useState(false);
  const [promotionalUnits, setPromotionalUnits] = useState(new Set()); // Store IDs of promotional units
  const [allPromotions, setAllPromotions] = useState([]); // Store all promotions for this product
  const [showQuantityControls, setShowQuantityControls] = useState(false); // Track if quantity controls should be shown

  const { items, addItem, updateItemQuantity, removeItem } = useCart();
  const { showingTranslateValue, getNumberTwo, currency, lang } = useUtilsFunction();

  // Helper function for localized unit display
  const getLocalizedUnitDisplayName = (unit) => {
    return getUnitDisplayName(unit, lang);
  };

  const getLocalizedShortUnitName = (unit) => {
    return getShortUnitName(unit, lang);
  };

  // Check if product is in cart
  const currentCartItem = useMemo(() => {
    if (!selectedUnit) return null;
    return items.find((item) => 
      item.productId === product._id && 
      item.selectedUnitId === selectedUnit._id
    );
  }, [items, product._id, selectedUnit]);
  
  // Show quantity controls if item is already in cart
  useEffect(() => {
    if (currentCartItem) {
      setShowQuantityControls(true);
      setQuantity(currentCartItem.quantity);
    } else {
      setShowQuantityControls(false);
      setQuantity(1);
    }
  }, [currentCartItem]);

  // When a promotion with minQty > 1 becomes active, default the quantity
  useEffect(() => {
    if (activePromotion && activePromotion.type === 'fixed_price') {
      const min = activePromotion.minQty || 1;
      if (quantity < min) setQuantity(min);
    }
  }, [activePromotion]);

  // Fetch product units and promotions
  useEffect(() => {
    const fetchProductData = async () => {
      if (!product?._id) return;
      console.log('ProductCardModern: Fetching data for product:', product._id, 'hasMultiUnits:', product.hasMultiUnits);
      await Promise.all([fetchProductUnits(), !promotion ? fetchPromotions() : Promise.resolve()]);
    };
    fetchProductData();
  }, [product?._id, promotion]);

  const fetchProductUnits = async () => {
    console.log('ProductCardModern: fetchProductUnits called for product:', product._id, 'hasMultiUnits:', product?.hasMultiUnits);
    
    if (!product?.hasMultiUnits) {
      console.log('ProductCardModern: Creating default unit for single-unit product');
      // Create default unit for single-unit products
      const defaultUnit = {
        _id: `default-${product._id}`,
        product: product._id,
        unit: product?.basicUnit || { name: 'Unit', shortCode: 'pcs' },
        unitValue: 1,
        packQty: 1,
        price: product?.price || product?.prices?.price || 0,
        isDefault: true,
        isActive: true,
        unitType: 'basic'
      };
      console.log('ProductCardModern: Default unit created:', defaultUnit);
      setAvailableUnits([defaultUnit]);
      setSelectedUnit(defaultUnit);
      return;
    }

    console.log('ProductCardModern: Fetching multi-units for product:', product._id);
    setIsLoadingUnits(true);
    try {
      const response = await ProductUnitServices.getProductUnits(product._id);
      const units = response?.data || [];
      console.log('ProductCardModern: Fetched units:', units);
      
      if (units.length > 0) {
        setAvailableUnits(units);
        
        // If promotion prop is provided, try to find the matching unit
        if (promotion && promotion.unit) {
          console.log('ProductCardModern: Looking for promotional unit:', promotion.unit._id);
          const promotionalUnit = units.find(unit => unit._id === promotion.unit._id);
          if (promotionalUnit) {
            console.log('ProductCardModern: Found promotional unit:', promotionalUnit);
            setSelectedUnit(promotionalUnit);
            setActivePromotion(promotion);
            setHasCheckedPromotions(true);
            return;
          }
        }
        
        // First, try to find a unit with promotions (only if no promotion prop provided)
        let promotionalUnit = null;
        if (!promotion) {
          for (const unit of units) {
            try {
              const unitPromotions = await PromotionServices.getPromotionsByProductUnit(unit._id);
              if (unitPromotions && unitPromotions.length > 0) {
                promotionalUnit = unit;
                setActivePromotion(unitPromotions[0]);
                break;
              }
            } catch (error) {
              console.error('Error checking unit promotions:', error);
            }
          }
        }
        
        // Select promotional unit if found, otherwise use default logic
        const defaultUnit = promotionalUnit || 
                           units.find(unit => unit.isDefault && unit.isActive) || 
                           units.find(unit => unit.isActive) ||
                           units[0];
        console.log('ProductCardModern: Selected unit:', defaultUnit);
        setSelectedUnit(defaultUnit);
        setHasCheckedPromotions(true);
      } else {
        console.log('ProductCardModern: No units found, creating fallback unit');
        // Fallback to product price
        const fallbackUnit = {
          _id: `fallback-${product._id}`,
          product: product._id,
          unit: { name: 'Unit', shortCode: 'pcs' },
          unitValue: 1,
          packQty: 1,
          price: product?.price || product?.prices?.price || 0,
          isDefault: true,
          isActive: true,
          unitType: 'basic'
        };
        setAvailableUnits([fallbackUnit]);
        setSelectedUnit(fallbackUnit);
      }
    } catch (error) {
      console.error('Error fetching product units:', error);
      // Fallback to product price
      const fallbackUnit = {
        _id: `fallback-${product._id}`,
        product: product._id,
        unit: { name: 'Unit', shortCode: 'pcs' },
        unitValue: 1,
        packQty: 1,
        price: product?.price || product?.prices?.price || 0,
        isDefault: true,
        isActive: true,
        unitType: 'basic'
      };
      setAvailableUnits([fallbackUnit]);
      setSelectedUnit(fallbackUnit);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const promotions = await PromotionServices.getPromotionsForProduct(product._id);
      if (promotions && promotions.length > 0) {
        setActivePromotion(promotions[0]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  // Scan all units for promotions and store promotional unit IDs
  const scanAllUnitsForPromotions = async () => {
    if (!availableUnits.length) return;
    
    try {
      const promotionalUnitIds = new Set();
      const allPromotionData = [];
      
      // Check each unit for promotions (skip fallback and default units)
      for (const unit of availableUnits) {
        // Skip fallback, default, and system-generated units
        if (unit._id.startsWith('fallback-') || unit._id.startsWith('default-')) {
          console.log(`ProductCardModern: Skipping promotion fetch for system unit: ${unit._id}`);
          continue;
        }
        
        try {
          const unitPromotions = await PromotionServices.getPromotionsByProductUnit(unit._id);
          if (unitPromotions && unitPromotions.length > 0) {
            promotionalUnitIds.add(unit._id);
            allPromotionData.push(...unitPromotions.map(promo => ({
              ...promo,
              unitId: unit._id,
              unit: unit
            })));
          }
        } catch (error) {
          console.warn(`Error fetching promotions for unit ${unit._id}:`, error);
        }
      }
      
      setPromotionalUnits(promotionalUnitIds);
      setAllPromotions(allPromotionData);
      
      console.log('ProductCardModern: Promotional units found:', {
        promotionalUnitIds: Array.from(promotionalUnitIds),
        allPromotions: allPromotionData,
        availableUnits: availableUnits.map(u => ({ id: u._id, name: `${u.unitValue} ${getLocalizedShortUnitName(u)}` }))
      });
      
    } catch (error) {
      console.error('Error scanning units for promotions:', error);
    }
  };

  // Set promotion from prop if provided
  useEffect(() => {
    console.log('ProductCardModern: Setting promotion from prop:', promotion);
    if (promotion) {
      setActivePromotion(promotion);
      console.log('ProductCardModern: Active promotion set to:', promotion);
    }
  }, [promotion]);

  // Debug active promotion and selected unit
  useEffect(() => {
    console.log('ProductCardModern: Current state debug:', {
      productId: product?._id,
      productTitle: product?.title,
      hasMultiUnits: product?.hasMultiUnits,
      selectedUnit: selectedUnit,
      activePromotion: activePromotion,
      promotionFromProp: promotion,
      availableUnits: availableUnits.length,
      availableUnitsDetails: availableUnits.map(unit => ({
        id: unit._id,
        name: getLocalizedUnitDisplayName(unit),
        shortCode: unit.unit?.shortCode,
        unitValue: unit.unitValue,
        price: unit.price
      }))
    });
    
    // Check if we can find promotional matches
    if (activePromotion || promotion) {
      console.log('ProductCardModern: Promotion data analysis:', {
        activePromotion: {
          type: activePromotion?.type,
          value: activePromotion?.value,
          productUnit: activePromotion?.productUnit,
          unit: activePromotion?.unit,
          minQty: activePromotion?.minQty
        },
        promotionProp: {
          type: promotion?.type,
          value: promotion?.value,
          productUnit: promotion?.productUnit,
          unit: promotion?.unit,
          minQty: promotion?.minQty
        },
        // Try to find matches
        potentialMatches: availableUnits.map(unit => ({
          unitId: unit._id,
          unitName: getLocalizedShortUnitName(unit),
          matchesActivePromotionProductUnit: activePromotion?.productUnit?._id === unit._id,
          matchesActivePromotionUnit: activePromotion?.unit?._id === unit._id,
          matchesPromotionPropProductUnit: promotion?.productUnit?._id === unit._id,
          matchesPromotionPropUnit: promotion?.unit?._id === unit._id
        }))
      });
    }
  }, [product, selectedUnit, activePromotion, promotion, availableUnits]);

  // Scan all units for promotions when units are loaded
  useEffect(() => {
    if (availableUnits.length > 0 && !hasCheckedPromotions) {
      scanAllUnitsForPromotions();
      setHasCheckedPromotions(true);
    }
  }, [availableUnits]);

  // Fetch unit-specific promotions when selectedUnit changes (but not on initial load)
  useEffect(() => {
    const fetchUnitPromotions = async () => {
      if (!selectedUnit?._id || !hasCheckedPromotions) return;
      
      // Skip fallback, default, and system-generated units
      if (selectedUnit._id.startsWith('fallback-') || selectedUnit._id.startsWith('default-')) {
        console.log(`ProductCardModern: Skipping promotion fetch for system unit: ${selectedUnit._id}`);
        return;
      }
      
      try {
        // First try to get unit-specific promotions
        const unitPromotions = await PromotionServices.getPromotionsByProductUnit(selectedUnit._id);
        if (unitPromotions && unitPromotions.length > 0) {
          setActivePromotion(unitPromotions[0]);
        } else {
          // Don't clear activePromotion completely, just set it to null for this unit
          // but keep the promotional unit detection working
          setActivePromotion(null);
        }
      } catch (error) {
        console.error('Error fetching unit promotions:', error);
        setActivePromotion(null);
      }
    };

    if (selectedUnit && hasCheckedPromotions) {
      fetchUnitPromotions();
    }
  }, [selectedUnit, hasCheckedPromotions]);

  // Calculate pricing
  const pricingInfo = useMemo(() => {
    console.log('ProductCardModern: Calculating pricing for unit:', selectedUnit?._id, 'with promotion:', activePromotion?.type);
    
    if (!selectedUnit) return { 
      basePrice: 0, 
      finalPrice: 0, 
      savings: 0, 
      isPromotional: false,
      pricePerBaseUnit: 0
    };

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;

    console.log('ProductCardModern: Base price:', basePrice, 'for unit:', selectedUnit._id);

    // Apply promotion if available and meets quantity requirements
    if (activePromotion && quantity >= (activePromotion.minQty || 1)) {
      console.log('ProductCardModern: Checking promotion application for unit:', selectedUnit._id);
      console.log('ProductCardModern: Active promotion:', {
        type: activePromotion.type,
        value: activePromotion.value,
        productUnitId: activePromotion.productUnit?._id,
        selectedUnitId: selectedUnit._id,
        minQty: activePromotion.minQty,
        currentQuantity: quantity
      });

      // Check if this promotion applies to the current unit
      const isUnitSpecificPromotion = activePromotion.productUnit && 
                                     activePromotion.productUnit._id === selectedUnit._id;
      
      // Check if it's a general product promotion (applies to all units)
      const isGeneralPromotion = !activePromotion.productUnit || 
                                activePromotion.product === product._id;
      
      // Additional check for unit matching by barcode or unit properties
      const isUnitMatchByProperties = activePromotion.productUnit && 
                                     selectedUnit.unit && 
                                     activePromotion.productUnit.unit && 
                                     selectedUnit.unit.shortCode === activePromotion.productUnit.unit.shortCode &&
                                     selectedUnit.unitValue === activePromotion.productUnit.unitValue;
      
      console.log('ProductCardModern: Promotion application check:', {
        isUnitSpecificPromotion,
        isGeneralPromotion,
        isUnitMatchByProperties,
        applies: isUnitSpecificPromotion || isGeneralPromotion || isUnitMatchByProperties
      });
      
      if (isUnitSpecificPromotion || isGeneralPromotion || isUnitMatchByProperties) {
        if (activePromotion.type === 'fixed_price') {
          const promoPrice = activePromotion.value || activePromotion.offerPrice || 0;
          console.log('ProductCardModern: Applying fixed price promotion:', promoPrice);
          
          // Ensure promotional price is valid
          if (promoPrice > 0) {
            const maxQty = activePromotion.maxQty || null;

            if (maxQty && quantity > maxQty) {
              // Beyond maxQty we revert to regular price for the excess
              const promoPortion = promoPrice * maxQty;
              const regularPortion = basePrice * (quantity - maxQty);
              finalPrice = (promoPortion + regularPortion) / quantity;
              console.log('ProductCardModern: Applied max quantity limit, final price:', finalPrice);
            } else {
              finalPrice = promoPrice;
              console.log('ProductCardModern: Applied promotional price:', finalPrice);
            }

            // Calculate savings properly
            const originalPrice = activePromotion.originalPrice || 
                                 activePromotion.productUnit?.price || 
                                 basePrice;
            savings = Math.max(0, originalPrice - finalPrice);
            isPromotional = true;
            
            console.log('ProductCardModern: Promotion applied successfully:', {
              originalPrice,
              finalPrice,
              savings,
              isPromotional
            });
          } else {
            console.warn('ProductCardModern: Invalid promotion price:', promoPrice);
          }
        } else if (activePromotion.type === 'bulk_purchase') {
          const totalRequired = activePromotion.requiredQty || activePromotion.minQty || 1;
          const freeQty = activePromotion.freeQty || 0;
          const originalPrice = activePromotion.originalPrice || 
                               activePromotion.productUnit?.price || 
                               basePrice;
          
          if (totalRequired > 0 && (totalRequired + freeQty) > 0) {
            const effectivePrice = (originalPrice * totalRequired) / (totalRequired + freeQty);
            finalPrice = effectivePrice;
            savings = Math.max(0, originalPrice - effectivePrice);
            isPromotional = true;
            
            console.log('ProductCardModern: Applied bulk purchase promotion:', {
              totalRequired,
              freeQty,
              originalPrice,
              effectivePrice,
              savings
            });
          }
        } else if (activePromotion.type === 'percentage_discount') {
          const discountPercent = activePromotion.value || 0;
          if (discountPercent > 0 && discountPercent <= 100) {
            finalPrice = basePrice * (1 - discountPercent / 100);
            savings = basePrice - finalPrice;
            isPromotional = savings > 0;
            
            console.log('ProductCardModern: Applied percentage discount:', {
              discountPercent,
              basePrice,
              finalPrice,
              savings
            });
          }
        }
      } else {
        console.log('ProductCardModern: Promotion does not apply to this unit');
      }
    } else {
      console.log('ProductCardModern: No promotion or quantity requirement not met');
    }

    const result = { 
      basePrice: isPromotional ? (activePromotion?.originalPrice || activePromotion?.productUnit?.price || basePrice) : basePrice, 
      finalPrice: Math.max(0, finalPrice), 
      savings: Math.max(0, savings), 
      isPromotional,
      pricePerBaseUnit: selectedUnit.packQty ? finalPrice / selectedUnit.packQty : finalPrice
    };

    console.log('ProductCardModern: Final pricing result:', result);
    return result;
  }, [selectedUnit, activePromotion, quantity, product._id]);

  // Calculate available stock
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / (selectedUnit.packQty || 1));
  }, [selectedUnit, product?.stock]);

  // Event handlers
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
      
      // If quantity controls are shown and item is in cart, update cart immediately
      if (showQuantityControls && currentCartItem) {
        updateItemQuantity(currentCartItem.id, newQuantity);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedUnit) {
      return notifyError("Please select a unit!");
    }

    if (availableStock < 1) {
      return notifyError("Out of stock!");
    }
    
    if (quantity > availableStock) {
      return notifyError(`Only ${availableStock} units available!`);
    }

    const cartItem = {
      id: `${product._id}-${selectedUnit._id}`,
      productId: product._id,
      selectedUnitId: selectedUnit._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: (activePromotion && quantity >= (activePromotion.minQty || 1))
              ? (activePromotion.offerPrice || activePromotion.value || selectedUnit.price)
              : selectedUnit.price,
      basePrice: selectedUnit.price,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      unitName: getLocalizedUnitDisplayName(selectedUnit),
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      promotion: activePromotion,
      isPromotional: pricingInfo.isPromotional,
      savings: pricingInfo.savings,
      maxQty: activePromotion?.maxQty || null,
      minQty: activePromotion?.minQty || 1
    };

    const existingItem = items.find(item => item.id === cartItem.id);
    
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      // If promotion now applies and price differs, rebuild the item
      const promoPrice = pricingInfo.finalPrice;
      if (existingItem.price !== promoPrice) {
        removeItem(existingItem.id);
        addItem(cartItem, newQty);
      } else {
        updateItemQuantity(cartItem.id, newQty);
      }
    } else {
      addItem(cartItem, quantity);
    }

          notifySuccess(`${quantity} ${getLocalizedUnitDisplayName(selectedUnit)} added to cart!`);
    
    // Show quantity controls after adding to cart
    setShowQuantityControls(true);
  };

  // Get safe product data
  const getProductImage = () => {
    if (product?.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image[0];
    }
    return '/images/placeholder.svg';
  };

  // Helper to extract English & Arabic titles
  const getProductTitles = () => {
    const titleData = product?.title;
    if (!titleData) return { en: 'Product', ar: '' };
    if (typeof titleData === 'object') {
      return {
        en: titleData.en || titleData.en_US || titleData.en_us || titleData.en_GB || '',
        ar: titleData.ar || titleData.ar_SA || titleData.ar_sa || '',
      };
    }
    return { en: titleData, ar: '' };
  };

  const { en: titleEn, ar: titleAr } = getProductTitles();

  // Get pack quantity display information
  const getPackQuantityDisplay = () => {
    if (!selectedUnit || selectedUnit.packQty <= 1) return null;
    
    return {
      packQty: selectedUnit.packQty,
      unitName: getLocalizedUnitDisplayName(selectedUnit),
      totalBaseUnits: quantity * selectedUnit.packQty,
      pricePerPiece: pricingInfo.finalPrice / selectedUnit.packQty
    };
  };

  const packInfo = getPackQuantityDisplay();

  if (!product) return null;

  return (
    <>
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          attributes={attributes}
          selectedUnit={selectedUnit}
          promotion={activePromotion}
        />
      )}

      <div 
        className={`product-card bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${className}`}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden">
          {/* Enhanced Promotion Banner */}
          {pricingInfo.isPromotional && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 z-10 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IoFlashOutline size={14} />
                  <span className="text-xs font-bold">{t('specialOffer')}</span>
                </div>
                {activePromotion?.endDate && (
                  <div className="flex items-center space-x-1 text-xs">
                    <span>⏰</span>
                    <span>{Math.ceil((new Date(activePromotion.endDate) - new Date()) / (1000 * 60 * 60 * 24))} {t('daysLeft')}</span>
                  </div>
                )}
              </div>
              {pricingInfo.savings > 0 && (
                <div className="text-xs font-bold mt-1">
                  {t('save')} {((pricingInfo.savings / pricingInfo.basePrice) * 100).toFixed(0)}% • {currency}{pricingInfo.savings.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Favorite Button */}
          {showFavorite && (
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all z-10 hover:scale-110"
            >
              {isFavorite ? (
                <IoHeart className="text-red-500" size={16} />
              ) : (
                <IoHeartOutline className="text-gray-600" size={16} />
              )}
            </button>
          )}

          {/* Product Image */}
          <div 
            className={`relative cursor-pointer overflow-hidden bg-gray-50 ${
              compact 
                ? 'h-52 sm:h-60' 
                : pricingInfo.isPromotional 
                  ? 'h-60 sm:h-72' 
                  : 'h-56 sm:h-64'
            }`}
            onClick={() => setModalOpen(true)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={getProductImage()}
              alt={titleEn || 'Product'}
              fill
                className={`transition-transform duration-500 hover:scale-110 ${
                  pricingInfo.isPromotional 
                    ? 'object-contain p-2' 
                    : 'object-cover'
                }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                // Prevent infinite loop by checking if we've already set a fallback
                if (!e.target.dataset.fallbackSet) {
                  e.target.dataset.fallbackSet = 'true';
                  e.target.src = '/images/placeholder.svg';
                }
              }}
            />
            </div>
            
            {/* Hover Overlay */}
            {isHovered && (
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(true);
                  }}
                  className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
                >
                  <IoEyeOutline size={18} />
                  <span>{t('quickView')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className={`p-1 sm:p-2 ${compact ? 'space-y-0.5' : 'space-y-1.5'} flex-1 flex flex-col`}>
          {/* Top Content - Fixed */}
          <div className="space-y-2">
          {/* Titles (EN + AR) */}
          <div onClick={() => setModalOpen(true)} className="cursor-pointer">
            {titleEn && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}
              >
                {titleEn}
              </h3>
            )}
            {titleAr && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}
                dir="rtl"
              >
                {titleAr}
              </h3>
            )}
          </div>

          {/* Rating */}
          {product.rating && !compact && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <IoStarSharp
                    key={i}
                    className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}
                    size={14}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating.toFixed(1)} ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Unit Selector */}
          {availableUnits.length > 1 && !compact && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t('unit')}:</label>
              <div className="flex flex-wrap gap-1.5">
                {availableUnits.slice(0, 5).map((unit, index) => {
                  const isSelected = selectedUnit?._id === unit._id;
                  
                  // Enhanced promotion detection - use stored promotional units
                  let hasPromotion = promotionalUnits.has(unit._id);
                  
                  // Check if promotion prop matches this unit (for Special Prices and Promotions pages)
                  if (!hasPromotion && promotion && promotion.productUnit) {
                    hasPromotion = promotion.productUnit._id === unit._id;
                  }
                  
                  // Check activePromotion (for All Products page)
                  if (!hasPromotion && activePromotion) {
                    hasPromotion = (
                      // Direct unit match
                      activePromotion.productUnit?._id === unit._id ||
                      activePromotion.unit?._id === unit._id ||
                      // Try to match by unit type (e.g., if promotion mentions "ctn12" and this unit is ctn12)
                      (activePromotion?.productUnit?.unit?.shortCode && 
                       unit.unit?.shortCode === activePromotion.productUnit.unit.shortCode &&
                       unit.unitValue === activePromotion.productUnit.unitValue) ||
                      // Check if this unit has savings compared to its original price
                      (product.promotion && product.promotion.unit && 
                       unit.unit?.shortCode === product.promotion.unit.unit?.shortCode &&
                       unit.unitValue === product.promotion.unit.unitValue)
                    );
                  }
                  

                  
                  return (
                    <button
                      key={unit._id}
                      onClick={() => handleUnitChange(unit)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border relative ${
                        hasPromotion
                          ? 'bg-red-50 text-red-700 border-red-500 border-2 hover:bg-red-100' // Always red for promotional units
                          : isSelected
                            ? 'bg-purple-600 text-white border-purple-600' // Regular + Selected  
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' // Regular + Not Selected
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span>{getLocalizedShortUnitName(unit)}{unit.unitValue > 1 ? ` ${unit.unitValue}` : ''}</span>
                          {hasPromotion && (
                            <span className="text-xs">🔥</span>
                          )}
                          {isSelected && <IoCheckmarkCircle size={12} />}
                        </div>
                        {unit.packQty > 1 && (
                          <div className="text-xs opacity-75 mt-0.5">
                            {unit.packQty} {t('pcs')}
                          </div>
                        )}
                      </div>
                      {hasPromotion && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                          🔥
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pack & Promotion Information – unified two-column row */}
          {packInfo && !compact && (
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Left – pack info */}
              <div className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>{t('packSize')}:</span>
                    <span className="font-semibold">{packInfo.packQty} {t('pieces')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('pricePerPiece')}:</span>
                    <span className="font-semibold">{currency}{packInfo.pricePerPiece.toFixed(2)}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                      <span>{t('totalPieces')}:</span>
                      <span className="font-semibold text-blue-700">{packInfo.totalBaseUnits} {t('pieces')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right – promotional info (only if there is an active promotion on the selected unit) */}
              {activePromotion && pricingInfo.isPromotional && (
                <div className="relative flex-1 p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-red-700">
                      {t('pleaseSelect')} {activePromotion.minQty || 1} {getLocalizedShortUnitName(activePromotion.productUnit || selectedUnit)}{(activePromotion.productUnit?.unitValue || selectedUnit?.unitValue) > 1 ? ` ${activePromotion.productUnit?.unitValue || selectedUnit?.unitValue}` : ''} {t('getFor','',{fallback:'for'})}
                    </div>
                    <div className="text-xl font-extrabold text-red-600">
                      {pricingInfo.finalPrice > 0 ? `${currency}${pricingInfo.finalPrice.toFixed(2)}` : 'Price not available'}
                    </div>
                    {/* Original price below promotional price */}
                    <div className="text-sm text-red-400 line-through">
                      {currency}{pricingInfo.basePrice.toFixed(2)}
                    </div>
                    {/* Min / Max quantity information inside promo */}
                    <div className="min-max-container flex justify-between text-xs text-red-600 font-medium gap-2">
                      <div className="flex-1 text-center border border-red-300 rounded px-2 py-1 bg-red-50">
                        <span>{t('min')} {activePromotion.minQty || 1}</span>
                      </div>
                      {activePromotion.maxQty && (
                        <div className="flex-1 text-center border border-red-300 rounded px-2 py-1 bg-red-50">
                          <span>{t('max')} {activePromotion.maxQty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Middle Content - Flexible */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Enhanced Promotional Pricing */}
          <div className="space-y-1">
            <div
              key={`${selectedUnit?._id}-${pricingInfo.isPromotional}`}
              className="transition-all duration-200"
            >
              {pricingInfo.isPromotional ? (
                  <div className="space-y-2">
                    {/* Main Price Display */}
                    {/* Duplicate price removed — shown in promo panel already */}
                    
                    {/* Placeholder to reserve space for consistent height */}
                    <div className="min-h-[1 rem]"></div>
                    
                                      {/* Min/Max Quantity Info - Only show for promotional units */}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Price with unit inline */}
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {pricingInfo.finalPrice > 0 ? `${currency}${pricingInfo.finalPrice.toFixed(2)}` : 'Price not available'}
                      </span>
                      {selectedUnit && pricingInfo.finalPrice > 0 && (
                        <span className="text-sm text-gray-600 font-medium">
                          / {getLocalizedShortUnitName(selectedUnit)}{selectedUnit.unitValue > 1 ? ` ${selectedUnit.unitValue}` : ''}
                        </span>
                      )}
                    </div>
                    
                    {/* Dynamic Product Information */}
                    {(() => {
                      const infoNode = (() => {
                        // Check if we have promotion prop with unit data (for Special Prices and Promotions pages)
                        if (promotion && promotion.productUnit && availableUnits.length > 1) {
                          const promotionalUnit = promotion.productUnit;
                          const isPromotionalUnitSelected = selectedUnit?._id === promotionalUnit._id;
                          
                          if (!isPromotionalUnitSelected) {
                            const promotionalPrice = promotion.value || promotion.promotionalPrice || 150;
                            
                            return (
                              <>
                                <div className="text-sm font-medium text-red-700 mb-1 flex items-center">
                                  <span className="mr-1">🔥</span>
                                  {t('pleaseSelect')} {getLocalizedShortUnitName(promotionalUnit)}{(promotionalUnit.unitValue > 1) ? ` ${promotionalUnit.unitValue}` : ''}
                                </div>
                                <div className="text-xs text-red-600">
                                  {t('toGetOfferPriceFor')} {currency}{promotionalPrice.toFixed(2)}
                                </div>
                              </>
                            );
                          }
                        }
                        
                        // Find promotional units using stored promotional units (for All Products page)
                        const promotionalUnit = availableUnits.find(unit => promotionalUnits.has(unit._id));
                        const isPromotionalUnitSelected = promotionalUnit && selectedUnit?._id === promotionalUnit._id;
                        
                        if (promotionalUnit && !isPromotionalUnitSelected && availableUnits.length > 1) {
                          // Find the promotion data for this promotional unit
                          const unitPromotion = allPromotions.find(promo => promo.unitId === promotionalUnit._id);
                          const promotionalPrice = unitPromotion?.value || unitPromotion?.offerPrice || 150; // fallback to 150
                          
                          return (
                            <>
                              <div className="text-sm font-medium text-red-700 mb-1 flex items-center">
                                <span className="mr-1">🔥</span>
                                {t('pleaseSelect')} {getLocalizedShortUnitName(promotionalUnit)}{promotionalUnit.unitValue > 1 ? ` ${promotionalUnit.unitValue}` : ''}
                              </div>
                              <div className="text-xs text-red-600">
                                {t('toGetOfferPriceFor')} {currency}{promotionalPrice.toFixed(2)}
                              </div>
                            </>
                          );
                        }
                        
                        // Show regular product information
                        return null;
                      })();
                      return infoNode ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3 flex flex-col justify-center text-center">
                          {infoNode}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Content - Fixed */}
          <div className="space-y-2 mt-auto">
          {/* Stock & SKU row hidden in new layout */}
          {false && (
            <div className="flex items-center justify-between">
              <div className={pricingInfo.isPromotional ? "text-xs" : "text-sm"}>
                {availableStock > 0 ? (
                  <span className="text-green-600 font-medium">
                    {availableStock} {t('inStock')}
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">{t('outOfStock')}</span>
                )}
              </div>
              {product.sku && (
                <span className={`text-gray-500 ${pricingInfo.isPromotional ? "text-xs" : "text-sm"}`}>
                  {t('sku')}: {product.sku}
                </span>
              )}
            </div>
          )}

          {/* Quantity Selector - Only shown after adding to cart */}
          {showQuantitySelector && !compact && showQuantityControls && (
            <div className="flex items-center justify-between">
                <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                    className="p-1.5 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <IoRemove size={14} />
                </button>
                  <span className="px-3 py-1.5 font-medium min-w-[50px] text-center text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= availableStock}
                    className="p-1.5 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <IoAdd size={14} />
                </button>
              </div>
            </div>
          )}

            {/* Enhanced Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={availableStock === 0 || !selectedUnit}
              className={`w-full py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                pricingInfo.isPromotional 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
              } ${
                availableStock === 0 || !selectedUnit 
                  ? 'from-gray-300 to-gray-400 cursor-not-allowed' 
                  : ''
              }`}
          >
            {availableStock === 0 ? (
              t('outOfStock')
            ) : currentCartItem ? (
              `${t('updateCart')} • ${currency}${(pricingInfo.finalPrice * quantity).toFixed(2)}`
                          ) : pricingInfo.isPromotional && activePromotion ? (
              `${t('addToCart')} ${activePromotion.minQty || quantity} ${activePromotion.productUnit?.unit?.shortCode || selectedUnit?.unit?.shortCode || 'CTN'}${(activePromotion.productUnit?.unitValue || selectedUnit?.unitValue) > 1 ? ` ${activePromotion.productUnit?.unitValue || selectedUnit?.unitValue}` : ''}`
            ) : (
              `${t('addToCart')} • ${currency}${(pricingInfo.finalPrice * quantity).toFixed(2)}`
            )}
          </button>
            
            {/* Max Offer Limit Info hidden */}
            {false && pricingInfo.isPromotional && activePromotion?.maxQty && (
              <div className="text-xs text-center text-gray-500">
                • Max on offer: {activePromotion.maxQty} {selectedUnit?.unit?.shortCode || 'CTN'}{selectedUnit?.unitValue > 1 ? ` ${selectedUnit?.unitValue}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCardModern;