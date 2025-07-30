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
import useAddToCart from "@hooks/useAddToCart";
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
  const { handleAddItem } = useAddToCart();
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
      
      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('Product data fetch timeout for product:', product._id);
        // Ensure we have at least a basic unit if timeout occurs
        if (!selectedUnit) {
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
      }, 10000); // 10 second timeout
      
      try {
        await Promise.all([
          fetchProductUnits(), 
          !promotion ? fetchPromotions() : Promise.resolve()
        ]);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Error fetching product data:', error);
        clearTimeout(timeoutId);
        // Ensure we have at least a basic unit even if API calls fail
        if (!selectedUnit) {
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
      }
    };
    fetchProductData();
  }, [product?._id, promotion]);

  const fetchProductUnits = async () => {
    if (!product?.hasMultiUnits) {
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
      setAvailableUnits([defaultUnit]);
      setSelectedUnit(defaultUnit);
      return;
    }

    setIsLoadingUnits(true);
    try {
      const response = await ProductUnitServices.getProductUnits(product._id);
      const units = response?.data || [];
      
      if (units.length > 0) {
        setAvailableUnits(units);
        
        // If promotion prop is provided, try to find the matching unit
        if (promotion && promotion.unit) {
          const promotionalUnit = units.find(unit => unit._id === promotion.unit._id);
          if (promotionalUnit) {
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
              const unitPromotions = await PromotionServices.getProductUnitPromotions(unit._id);
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
        setSelectedUnit(defaultUnit);
        setHasCheckedPromotions(true);
      } else {
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
      const promotions = await PromotionServices.getPromotionsByProduct(product._id);
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
          continue;
        }
        
        try {
          const unitPromotions = await PromotionServices.getProductUnitPromotions(unit._id);
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
      
    } catch (error) {
      console.error('Error scanning units for promotions:', error);
    }
  };

  // Set promotion from prop if provided
  useEffect(() => {
    if (promotion) {
      setActivePromotion(promotion);
    }
  }, [promotion]);



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
        return;
      }
      
      try {
        // First try to get unit-specific promotions
        const unitPromotions = await PromotionServices.getProductUnitPromotions(selectedUnit._id);
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

  // Calculate pricing with max quantity support
  const pricingInfo = useMemo(() => {
    if (!selectedUnit) {
      return { 
        basePrice: 0, 
        finalPrice: 0, 
        savings: 0, 
        isPromotional: false,
        pricePerBaseUnit: 0,
        minQtyTotal: 0,
        minQty: 1,
        perUnitPrice: 0,
        promoUnits: 0,
        normalUnits: 0,
        promoUnitPrice: 0,
        normalUnitPrice: 0,
        breakdown: ''
      };
    }

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;
    let minQtyTotal = 0;
    let minQty = 1;
    let perUnitPrice = basePrice;
    let promoUnits = 0;
    let normalUnits = quantity;
    let promoUnitPrice = basePrice;
    let normalUnitPrice = basePrice;
    let breakdown = '';

    // Apply promotion if available and meets quantity requirements
    if (activePromotion && quantity >= (activePromotion.minQty || 1)) {
      const promoMinQty = activePromotion.minQty || 1;
      const maxQty = activePromotion.maxQty || null;
      minQty = promoMinQty;
      
      if (activePromotion.type === 'fixed_price') {
        promoUnitPrice = activePromotion.value || activePromotion.offerPrice || basePrice;
        
        // Handle max quantity limit
        if (maxQty && quantity > maxQty) {
          promoUnits = maxQty;
          normalUnits = quantity - maxQty;
        } else {
          promoUnits = quantity;
          normalUnits = 0;
        }
        
        // Calculate blended price
        const promoSubtotal = promoUnits * promoUnitPrice;
        const normalSubtotal = normalUnits * basePrice;
        const totalPrice = promoSubtotal + normalSubtotal;
        finalPrice = totalPrice / quantity; // Average price per unit
        perUnitPrice = finalPrice;
        minQtyTotal = promoUnitPrice * promoMinQty;
        
        const originalPrice = activePromotion.originalPrice || activePromotion.productUnit?.price || basePrice;
        savings = Math.max(0, (originalPrice - promoUnitPrice) * promoUnits);
        isPromotional = promoUnits > 0;
        
        // Create breakdown string
        breakdown = `${promoUnits} × ${promoUnitPrice.toFixed(2)}`;
        if (normalUnits > 0) {
          breakdown += ` + ${normalUnits} × ${basePrice.toFixed(2)}`;
        }
      } else if (activePromotion.type === 'bulk_purchase') {
        const totalRequired = activePromotion.requiredQty || activePromotion.minQty || 1;
        const freeQty = activePromotion.freeQty || 0;
        const originalPrice = activePromotion.originalPrice || 
                             activePromotion.productUnit?.price || 
                             basePrice;
        const effectivePrice = (originalPrice * totalRequired) / (totalRequired + freeQty);
        finalPrice = effectivePrice;
        perUnitPrice = effectivePrice;
        minQtyTotal = effectivePrice * promoMinQty;
        savings = Math.max(0, originalPrice - effectivePrice);
        isPromotional = true;
        promoUnits = quantity;
        normalUnits = 0;
        promoUnitPrice = effectivePrice;
      }
    } else {
      minQty = 1;
      minQtyTotal = basePrice;
      perUnitPrice = basePrice;
      promoUnits = 0;
      normalUnits = quantity;
      promoUnitPrice = basePrice;
      normalUnitPrice = basePrice;
    }

    return { 
      basePrice: isPromotional ? (activePromotion.originalPrice || activePromotion.productUnit?.price || basePrice) : basePrice, 
      finalPrice: Math.max(0, finalPrice), 
      savings: Math.max(0, savings), 
      isPromotional,
      pricePerBaseUnit: selectedUnit.packQty ? finalPrice / selectedUnit.packQty : finalPrice,
      minQtyTotal,
      minQty,
      perUnitPrice,
      promoUnits,
      normalUnits,
      promoUnitPrice,
      normalUnitPrice,
      breakdown
    };
  }, [selectedUnit, activePromotion, quantity, product._id]);

  // Calculate available stock
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / (selectedUnit.packQty || 1));
  }, [selectedUnit, product?.stock]);

  // Helper for offer price display
  const getOfferPriceDisplay = () => {
    if (activePromotion && selectedUnit && activePromotion.minQty > 1) {
      // Calculate total price for minQty
      const total = (activePromotion.value * activePromotion.minQty).toFixed(2);
      // Use translation for 'for' and unit
      const forText = t('for', { defaultValue: 'for' });
      const pcsText = selectedUnit.unit?.shortCode || t('pcs', { defaultValue: 'pcs' });
      return `${currency}${total} / ${activePromotion.minQty} ${pcsText}`;
    }
    return null;
  };

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
    
    // For promotional items, enforce minimum quantity
    let quantityToAdd = quantity;
    if (activePromotion && activePromotion.minQty > 1) {
      quantityToAdd = Math.max(quantity, activePromotion.minQty);
      if (quantityToAdd > availableStock) {
        return notifyError(`Promotion requires minimum ${activePromotion.minQty} units but only ${availableStock} available!`);
      }
    } else if (quantity > availableStock) {
      return notifyError(`Only ${availableStock} units available!`);
    }

    const cartItem = {
      id: `${product._id}-${selectedUnit._id}`,
      productId: product._id,
      selectedUnitId: selectedUnit._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: pricingInfo.finalPrice, // Use the calculated blended price
      basePrice: selectedUnit.price,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      unitName: getLocalizedUnitDisplayName(selectedUnit),
      unit: selectedUnit.unit, // Pass the full unit object for localization in cart
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      promotion: activePromotion,
      isPromotional: pricingInfo.isPromotional,
      savings: pricingInfo.savings,
      maxQty: activePromotion?.maxQty || null,
      minQty: activePromotion?.minQty || 1,
      promoUnits: pricingInfo.promoUnits,
      normalUnits: pricingInfo.normalUnits,
      promoUnitPrice: pricingInfo.promoUnitPrice,
      normalUnitPrice: pricingInfo.normalUnitPrice
    };

    // Use the handleAddItem from useAddToCart hook which handles minimum quantity logic
    handleAddItem(cartItem, quantityToAdd);
    
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

  // Show loading skeleton if units are still loading
  if (isLoadingUnits && availableUnits.length === 0) {
    return (
      <div className={`product-card bg-white rounded-2xl shadow-md overflow-hidden flex flex-col ${className}`}>
        <div className="relative overflow-hidden">
          <div className="w-full h-48 bg-gray-200 animate-pulse rounded-t-lg"></div>
        </div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

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
        className={`product-card ${!pricingInfo.isPromotional && availableUnits.length <= 1 ? 'product-card-simple' : ''} bg-white rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col ${className}`}
      >
        {/* Image Section */}
        <div className="relative overflow-hidden">
          {/* Offer Expiry Date - Moved from Promotion Banner */}
          {pricingInfo.isPromotional && activePromotion?.endDate && (
            <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
              <span>⏰</span>
              <span>{Math.ceil((new Date(activePromotion.endDate) - new Date()) / (1000 * 60 * 60 * 24))} {t('daysLeft')}</span>
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
            onClick={() => setModalOpen(!modalOpen)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative overflow-hidden w-full h-48 bg-gray-50 rounded-t-lg cursor-pointer product-image-container"
          >
            <Image
              src={getProductImage()}
              alt={showingTranslateValue(product?.title) || 'Product Image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              className="object-contain transition-transform duration-300 ease-in-out transform hover:scale-105"
            />
            
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
        <div className={`product-card-responsive ${compact ? 'space-y-0.5' : pricingInfo.isPromotional ? 'space-y-0.5 sm:space-y-1' : 'space-y-0.5'} flex-1 flex flex-col ${
          !pricingInfo.isPromotional && availableUnits.length <= 1 ? 'p-1.5' : 
          !pricingInfo.isPromotional ? 'p-1.5 sm:p-2.5' : 
          'p-2 sm:p-3'
        }`}>
          {/* Top Content - Fixed */}
          <div className={`${
            pricingInfo.isPromotional ? 'space-y-1' : 
            availableUnits.length > 1 ? 'space-y-0.5' : 
            'space-y-0.5'
          } ${!pricingInfo.isPromotional && availableUnits.length <= 1 ? 'mb-0.5' : ''}`}>
          {/* Titles (EN + AR) */}
          <div onClick={() => setModalOpen(true)} className="cursor-pointer">
            {/* Show only the appropriate language title based on current locale */}
            {lang === 'ar' && titleAr && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-responsive-xs' : 'text-responsive-sm'
                }`}
                dir="rtl"
              >
                {titleAr}
              </h3>
            )}
            {lang === 'en' && titleEn && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-responsive-xs' : 'text-responsive-sm'
                }`}
              >
                {titleEn}
              </h3>
            )}
            {/* Fallback: if current language title is not available, show the other language */}
            {lang === 'ar' && !titleAr && titleEn && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-responsive-xs' : 'text-responsive-sm'
                }`}
              >
                {titleEn}
              </h3>
            )}
            {lang === 'en' && !titleEn && titleAr && (
              <h3
                className={`font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors leading-tight ${
                  pricingInfo.isPromotional ? 'text-responsive-xs' : 'text-responsive-sm'
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
            <div className="space-y-0.5 sm:space-y-1">
              <label className="text-responsive-xs font-medium text-gray-700">{t('unit')}:</label>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
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
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all border relative ${
                        hasPromotion
                          ? 'bg-red-50 text-red-700 border-red-500 border-2 hover:bg-red-100' // Always red for promotional units
                          : isSelected
                            ? 'bg-purple-600 text-white border-purple-600' // Regular + Selected  
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' // Regular + Not Selected
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-0">
                        <div className="flex items-center space-x-1">
                          <span>{getLocalizedShortUnitName(unit)}{unit.unitValue > 1 ? ` ${unit.unitValue}` : ''}</span>
                          {hasPromotion && (
                            <span className="text-xs">🔥</span>
                          )}
                          {isSelected && <IoCheckmarkCircle size={12} />}
                        </div>
                        {unit.packQty > 1 && (
                          <div className="text-xs opacity-75">
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

          {/* Pack & Promotion Information – optimized compact layout */}
          {(!compact && packInfo) && (
            <div className="flex flex-col sm:flex-row gap-1.5">
              {/* Left – pack info */}
              {packInfo && (
              <div className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-800">
                  {/* Pack details in a cleaner grid layout */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('packSize')}:</span>
                      <span className="font-semibold">{packInfo.packQty} {t('pieces')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('pricePerPiece')}:</span>
                      <span className="font-semibold">{currency}{packInfo.pricePerPiece.toFixed(2)}</span>
                    </div>
                    {quantity > 1 && (
                      <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                        <span className="font-medium">{t('totalPieces')}:</span>
                        <span className="font-semibold text-blue-700">{packInfo.totalBaseUnits} {t('pieces')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Right – promotional info (only if there is an active promotion on the selected unit) */}
              {activePromotion && pricingInfo.isPromotional && (
                <div className="relative flex-1 p-2 bg-red-50 rounded-lg border border-red-200">
                  <div className="space-y-1">
                    {(() => {
                      const isPromoUnitSelected = activePromotion && activePromotion.productUnit && activePromotion.productUnit._id === selectedUnit._id;
                      if (!isPromoUnitSelected) {
                        return (
                    <div className="text-xs font-medium text-red-700 mb-1">
                            {t('pleaseSelect')} {getLocalizedUnitDisplayName(activePromotion.productUnit)}{(activePromotion.productUnit?.unitValue > 1) ? ` ${activePromotion.productUnit.unitValue}` : ''}
                    </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Promo price and old price multiplied by minQty - cleaner layout */}
                    <div className="space-y-1">
                      <div className="text-center">
                        <span className="text-lg font-extrabold text-red-600">
                          {currency}{(pricingInfo.finalPrice * pricingInfo.minQty).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-normal">
                          ({pricingInfo.minQty} × {pricingInfo.finalPrice.toFixed(2)})
                        </span>
                        <span className="text-red-400 line-through">
                          {currency}{(pricingInfo.basePrice * pricingInfo.minQty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {/* Min / Max quantity information inside promo - cleaner side by side */}
                    <div className="flex gap-1 text-xs text-red-600 font-medium mt-1">
                      <div className="flex-1 text-center border border-red-300 rounded px-1.5 py-1 bg-red-50">
                        <span>{t('min')} {activePromotion.minQty || 1}</span>
                      </div>
                      {activePromotion.maxQty && (
                        <div className="flex-1 text-center border border-red-300 rounded px-1.5 py-1 bg-red-50">
                          <span>{t('max')} {activePromotion.maxQty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Show promo panel even when packInfo is null (single unit) */}
          {!packInfo && !compact && activePromotion && pricingInfo.isPromotional && (
            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200 mt-1">
              <div className="text-xs font-medium text-red-700 text-center">
                {t('min')} {activePromotion.minQty || 1}
                {activePromotion.maxQty && (
                  <>
                    {' • '}{t('max')} {activePromotion.maxQty}
                  </>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Middle Content - Flexible */}
          <div className={`flex-1 flex flex-col ${
            !pricingInfo.isPromotional && availableUnits.length <= 1 ? 'justify-start' : 'justify-center'
          }`}>
            {/* Enhanced Promotional Pricing */}
          <div className={`${
            pricingInfo.isPromotional ? 'space-y-0.5' : 
            availableUnits.length > 1 ? 'space-y-0.5' : 
            'space-y-0'
          } ${!pricingInfo.isPromotional && availableUnits.length <= 1 ? 'mb-0' : ''}`}>
            <div
              key={`${selectedUnit?._id}-${pricingInfo.isPromotional}`}
              className="transition-all duration-200"
            >
              {pricingInfo.isPromotional ? (
                  <div className="space-y-0.5">
                    {/* Main Price Display – only visible when packQty = 1 (no separate promo panel) */}
                    {(!packInfo || packInfo === null) && (
                      <div className="space-y-0">
                        <span className="text-responsive-lg font-bold text-red-600">
                          {currency}{pricingInfo.minQtyTotal.toFixed(2)}
                          <span className="text-xs text-gray-500 font-normal ml-1">
                            ({pricingInfo.minQty} × {pricingInfo.perUnitPrice.toFixed(2)})
                          </span>
                        </span>
                        <span className="text-responsive-sm text-gray-500 line-through">
                          {currency}{(pricingInfo.basePrice * pricingInfo.minQty).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {/* Minimal placeholder height */}
                    <div className="min-h-[0.25rem]"></div>
                  </div>
                ) : (
                  <div className={`${availableUnits.length > 1 ? 'space-y-1' : 'space-y-0.5'}`}>
                    {/* Price with unit inline */}
                    <div className="flex items-baseline space-x-1">
                      <span className={`${availableUnits.length <= 1 ? 'text-responsive-base' : 'text-responsive-lg'} font-bold text-gray-900`}>
                        {currency}{pricingInfo.finalPrice.toFixed(2)}
                      </span>
                      {selectedUnit && (
                        <span className="text-responsive-xs text-gray-600 font-medium">
                          / {getLocalizedShortUnitName(selectedUnit.unit)}{selectedUnit.unitValue > 1 ? ` ${selectedUnit.unitValue}` : ''}
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
                            
                            console.log('[DEBUG] Informative card - promotionalUnit:', promotionalUnit);
                            console.log('[DEBUG] Informative card - promotionalUnit.unit:', promotionalUnit.unit);
                            console.log('[DEBUG] Informative card - unit nameAr:', promotionalUnit.unit?.nameAr);
                            
                            return (
                              <>
                                <div className="text-sm font-medium text-red-700 mb-1 flex items-center">
                                  <span className="mr-1">🔥</span>
                                  {t('pleaseSelect')} {getLocalizedShortUnitName(promotionalUnit.unit)}{(promotionalUnit.unitValue > 1) ? ` ${promotionalUnit.unitValue}` : ''}
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
                          
                          console.log('[DEBUG] Informative card - promotionalUnit (all products):', promotionalUnit);
                          console.log('[DEBUG] Informative card - promotionalUnit.unit (all products):', promotionalUnit.unit);
                          console.log('[DEBUG] Informative card - unit nameAr (all products):', promotionalUnit.unit?.nameAr);
                          
                          return (
                            <>
                              <div className="text-sm font-medium text-red-700 mb-1 flex items-center">
                                <span className="mr-1">🔥</span>
                                {t('pleaseSelect')} {getLocalizedShortUnitName(promotionalUnit.unit)}{(promotionalUnit.unitValue > 1) ? ` ${promotionalUnit.unitValue}` : ''}
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
          <div className={`${
            pricingInfo.isPromotional ? 'space-y-1' : 
            availableUnits.length > 1 ? 'space-y-0.5' : 
            'space-y-0.5'
          } mt-auto`}>
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
            <div className="space-y-0.5">
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
              
              {/* Max Quantity Warning - Replaced with Pricing Breakdown */}
              {pricingInfo.isPromotional && activePromotion?.maxQty && quantity > activePromotion.maxQty && (
                <div className="text-xs text-center text-gray-600">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <div>{pricingInfo.breakdown}</div>
                    <div className="mt-1 text-gray-500">
                      • {t('max')} {t('specialOffer')}: {activePromotion.maxQty} {getLocalizedUnitDisplayName(selectedUnit)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Enhanced Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={availableStock === 0 || !selectedUnit}
              className={`btn-responsive w-full rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
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
              // Show pricing breakdown when there's a max quantity limit
              activePromotion.maxQty && quantity > activePromotion.maxQty ? (
                `${t('addToCart')} • ${currency}${(pricingInfo.promoUnits * pricingInfo.promoUnitPrice + pricingInfo.normalUnits * pricingInfo.normalUnitPrice).toFixed(2)}`
              ) : (
                `${t('addToCart')} ${pricingInfo.minQty || quantity} ${getLocalizedUnitDisplayName(selectedUnit)}`
              )
            ) : (
              `${t('addToCart')} • ${currency}${(pricingInfo.finalPrice * quantity).toFixed(2)}`
            )}
          </button>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCardModern;