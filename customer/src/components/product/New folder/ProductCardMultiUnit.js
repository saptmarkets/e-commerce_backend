import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoStarSharp,
  IoStarOutline,
  IoHeartOutline,
  IoHeart,
  IoChevronDown,
  IoInformationCircleOutline
} from "react-icons/io5";
import { useCart } from "react-use-cart";

// Internal imports
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";
import ProductUnitServices from "@services/ProductUnitServices";
import PromotionServices from "@services/PromotionServices";
import { getUnitDisplayName as getLocalizedUnitName, getShortUnitName } from "@utils/unitUtils";

const ProductCardMultiUnit = ({ product, attributes, className = "" }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [promotionalUnits, setPromotionalUnits] = useState(new Set()); // Store IDs of promotional units
  // Promotion handling state
  const [activePromotion, setActivePromotion] = useState(null);
  const [hasCheckedPromotions, setHasCheckedPromotions] = useState(false);

  const { items, addItem, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo, lang } = useUtilsFunction();

  // Fetch available units for the product
  useEffect(() => {
    const fetchProductUnits = async () => {
      if (!product?._id || !product?.hasMultiUnits) {
        // If product doesn't have multi-units, create a default unit from basic product data
        const defaultUnit = {
          _id: `default-${product?._id}`,
          product: product?._id,
          unit: product?.basicUnit || null,
          unitValue: 1,
          packQty: 1,
          price: product?.price || 0,
          isDefault: true,
          isActive: true,
          isAvailable: true,
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
          // Set default unit or first available unit
          const defaultUnit = units.find(unit => unit.isDefault && unit.isActive) || 
                             units.find(unit => unit.isActive) ||
                             units[0];
          setSelectedUnit(defaultUnit);
        } else {
          // Fallback to basic product data if no units found
          const defaultUnit = {
            _id: `fallback-${product._id}`,
            product: product._id,
            unit: product?.basicUnit || null,
            unitValue: 1,
            packQty: 1,
            price: product?.price || 0,
            isDefault: true,
            isActive: true,
            isAvailable: true,
            unitType: 'basic'
          };
          setAvailableUnits([defaultUnit]);
          setSelectedUnit(defaultUnit);
        }
      } catch (error) {
        console.error('Error fetching product units:', error);
        // Fallback to basic product data on error
        const fallbackUnit = {
          _id: `error-fallback-${product._id}`,
          product: product._id,
          unit: product?.basicUnit || null,
          unitValue: 1,
          packQty: 1,
          price: product?.price || 0,
          isDefault: true,
          isActive: true,
          isAvailable: true,
          unitType: 'basic'
        };
        setAvailableUnits([fallbackUnit]);
        setSelectedUnit(fallbackUnit);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchProductUnits();
  }, [product?._id, product?.hasMultiUnits]);

  // Scan all units for promotions and store promotional unit IDs
  const scanAllUnitsForPromotions = async () => {
    if (!availableUnits.length) return;
    
    try {
      const promotionalUnitIds = new Set();
      
      // Check each unit for promotions
      for (const unit of availableUnits) {
        try {
          const unitPromotions = await PromotionServices.getPromotionsByProductUnit(unit._id);
          if (unitPromotions && unitPromotions.length > 0) {
            promotionalUnitIds.add(unit._id);
          }
        } catch (error) {
          console.warn(`Error fetching promotions for unit ${unit._id}:`, error);
        }
      }
      
      setPromotionalUnits(promotionalUnitIds);
      
      console.log('ProductCardMultiUnit: Promotional units found:', {
        promotionalUnitIds: Array.from(promotionalUnitIds),
        availableUnits: availableUnits.map(u => ({ id: u._id, name: getLocalizedUnitName(u, lang) }))
      });
      
    } catch (error) {
      console.error('Error scanning units for promotions:', error);
    }
  };

  // Scan for promotional units when units are loaded
  useEffect(() => {
    if (availableUnits.length > 0) {
      scanAllUnitsForPromotions();
    }
  }, [availableUnits]);

  // Mark that units have been loaded so we can proceed to check promotions
  useEffect(() => {
    if (availableUnits.length && !hasCheckedPromotions) {
      setHasCheckedPromotions(true);
    }
  }, [availableUnits, hasCheckedPromotions]);

  // Fetch promotions specific to the currently selected unit
  useEffect(() => {
    if (!selectedUnit?._id) return;

    // Skip system generated fallback/default units
    if (selectedUnit._id.startsWith('fallback-') || selectedUnit._id.startsWith('default-')) {
      setActivePromotion(null);
      return;
    }

    const fetchUnitPromotions = async () => {
      try {
        const promos = await PromotionServices.getPromotionsByProductUnit(selectedUnit._id);
        if (promos && promos.length > 0) {
          setActivePromotion(promos[0]);
        } else {
          setActivePromotion(null);
        }
      } catch (error) {
        console.error('Error fetching promotions for unit', selectedUnit._id, error);
        setActivePromotion(null);
      }
    };

    fetchUnitPromotions();
  }, [selectedUnit]);

  // Pricing calculation that takes promotions into account
  const pricingInfo = useMemo(() => {
    if (!selectedUnit) return { basePrice: 0, finalPrice: 0, savings: 0, isPromotional: false, pricePerBaseUnit: 0 };

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;

    if (activePromotion && quantity >= (activePromotion.minQty || 1)) {
      const isUnitSpecificPromotion = activePromotion.productUnit && activePromotion.productUnit._id === selectedUnit._id;
      const isGeneralPromotion = !activePromotion.productUnit || activePromotion.product === product._id;

      if (isUnitSpecificPromotion || isGeneralPromotion) {
        if (activePromotion.type === 'fixed_price') {
          const promoPrice = activePromotion.value || activePromotion.offerPrice || basePrice;
          finalPrice = promoPrice;
          const originalPrice = activePromotion.originalPrice || basePrice;
          savings = Math.max(0, originalPrice - promoPrice);
          isPromotional = true;
        } else if (activePromotion.type === 'bulk_purchase') {
          const totalRequired = activePromotion.requiredQty || activePromotion.minQty || 1;
          const freeQty = activePromotion.freeQty || 0;
          const effectivePrice = (basePrice * totalRequired) / (totalRequired + freeQty);
          finalPrice = effectivePrice;
          savings = Math.max(0, basePrice - effectivePrice);
          isPromotional = true;
        }
      }
    }

    return {
      basePrice: isPromotional ? (activePromotion?.originalPrice || basePrice) : basePrice,
      finalPrice: Math.max(0, finalPrice),
      savings,
      isPromotional,
      pricePerBaseUnit: selectedUnit.packQty ? finalPrice / selectedUnit.packQty : finalPrice
    };
  }, [selectedUnit, activePromotion, quantity, product._id]);

  // Calculate current cart item with selected unit
  const currentCartItem = useMemo(() => {
    if (!selectedUnit) return null;
    return items.find((item) => 
      item.productId === product._id && 
      item.selectedUnitId === selectedUnit._id
    );
  }, [items, product._id, selectedUnit]);

  // Calculate available stock for selected unit
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / selectedUnit.packQty);
  }, [selectedUnit, product?.stock]);

  // Handle unit selection
  const handleUnitSelection = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1); // Reset quantity when changing units
    setUnitDropdownOpen(false);
  };

  // Handle modal open
  const handleModalOpen = () => {
    setModalOpen(true);
  };

  // Handle adding to cart with selected unit
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
      id: `${product._id}-${selectedUnit._id}`, // Unique ID for cart
      productId: product._id,
      selectedUnitId: selectedUnit._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: pricingInfo.finalPrice,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      // Unit-specific information
      unitName: getLocalizedUnitName(selectedUnit, lang),
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      unitPrice: pricingInfo.finalPrice,
      baseProductPrice: pricingInfo.basePrice,
      promotion: activePromotion,
      isPromotional: pricingInfo.isPromotional,
      savings: pricingInfo.savings,
      // Additional metadata
      unitType: selectedUnit.unitType || 'multi',
      isMultiUnit: true
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantity);
    } else {
      addItem(cartItem, quantity);
    }
    
    const unitDisplayName = getLocalizedUnitName(selectedUnit, lang);
    notifySuccess(`Added ${quantity} ${unitDisplayName}(s) to cart!`);
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<IoStarSharp key={i} className="text-yellow-400" />);
      } else {
        stars.push(<IoStarOutline key={i} className="text-gray-300" />);
      }
    }
    
    return stars;
  };

  // Get product image
  const getProductImage = () => {
    try {
      if (product?.image && Array.isArray(product.image) && product.image.length > 0) {
        const imageUrl = product.image[0];
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          return imageUrl;
        }
      }
    } catch (error) {
      console.warn('Error processing product image:', error);
    }
    return '';
  };

  // Safe product data access
  const getProductTitle = () => {
    try {
      return showingTranslateValue(product?.title) || 'Product Name';
    } catch (error) {
      console.warn('Error getting product title:', error);
      return 'Product Name';
    }
  };

  // Calculate unit price per base unit
  const getUnitPricePerBase = () => {
    if (!selectedUnit || !selectedUnit.packQty) return 0;
    return selectedUnit.price / selectedUnit.packQty;
  };

  // Format unit display name with localization
  const getUnitDisplayName = (unit) => {
    if (!unit) return 'Unit';
    
    // Use localized unit name
    const unitName = getLocalizedUnitName(unit, lang);
    const unitValue = unit.unitValue || 1;
    
    if (unitValue === 1) {
      return unitName;
    }
    
    return `${unitValue} ${unitName}${unitValue > 1 ? 's' : ''}`;
  };

  const rating = product?.rating || 4.2;
  const reviewCount = product?.reviewCount || Math.floor(Math.random() * 100) + 10;

  if (isLoadingUnits) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          attributes={attributes}
          selectedUnit={selectedUnit}
          availableUnits={availableUnits}
        />
      )}

      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${className}`}>
        {/* Header with favorite and multi-unit badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            {product?.hasMultiUnits && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                MULTI-UNIT
              </span>
            )}
            {product?.discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {product.discount}% OFF
              </span>
            )}
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isFavorite ? (
              <IoHeart className="w-5 h-5 text-red-500" />
            ) : (
              <IoHeartOutline className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Product Image */}
        <div className="mb-6">
          <div 
            className="relative h-48 mb-3 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleModalOpen}
          >
            <Image
              src={getProductImage()}
              alt={getProductTitle()}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              onError={(e) => {
                e.target.src = '';
              }}
              loading="lazy"
            />
          </div>
        </div>

        {/* Product Title and Rating */}
        <h3 
          className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={handleModalOpen}
        >
          {getProductTitle()}
        </h3>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center space-x-1">
            {renderStars(rating)}
          </div>
          <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
        </div>

        {/* Unit Selection Dropdown */}
        {availableUnits.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <div className="relative">
              <button
                onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="font-medium">
                  {selectedUnit ? getUnitDisplayName(selectedUnit, lang) : 'Select Unit'}
                </span>
                <IoChevronDown className={`w-5 h-5 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {unitDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {availableUnits.map((unit) => {
                    const isSelected = selectedUnit?._id === unit._id;
                    const hasPromotion = promotionalUnits.has(unit._id);
                    
                    return (
                      <button
                        key={unit._id}
                        onClick={() => handleUnitSelection(unit)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between relative ${
                          hasPromotion
                            ? 'bg-red-50 text-red-700 border-l-4 border-red-500' // Always red for promotional units
                            : isSelected
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-900'
                        }`}
                      >
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{getUnitDisplayName(unit, lang)}</span>
                            {hasPromotion && (
                              <span className="text-red-500 animate-pulse">🔥</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Contains {unit.packQty} base units
                          </div>
                          {hasPromotion && (
                            <div className="text-xs font-medium text-red-600 mt-1">
                              🔥 Special Offer Available!
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${hasPromotion ? 'text-red-600' : ''}`}>
                            ${getNumberTwo(unit.price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${getNumberTwo(unit.price / unit.packQty)}/unit
                          </div>
                        </div>
                        {hasPromotion && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                            🔥
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Unit Information */}
        {selectedUnit && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected Unit:</span>
              <span className="font-semibold text-gray-900">
                {getUnitDisplayName(selectedUnit, lang)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Pack Quantity:</span>
              <span>{selectedUnit.packQty} base units</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Price per base unit:</span>
              <span>${getNumberTwo(pricingInfo.pricePerBaseUnit)}</span>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-3">
            <span className="text-2xl font-bold text-gray-900">
              ${getNumberTwo(pricingInfo.finalPrice)}
            </span>
            {pricingInfo.isPromotional && (
              <span className="text-lg text-gray-500 line-through">
                ${getNumberTwo(pricingInfo.basePrice)}
              </span>
            )}
          </div>
          {selectedUnit && (
            <div className="text-sm text-gray-600 mt-1">
              ${getNumberTwo(pricingInfo.pricePerBaseUnit)} per base unit
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          {availableStock > 0 ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">
                In Stock ({availableStock} {selectedUnit ? getUnitDisplayName(selectedUnit, lang).toLowerCase() : 'units'} available)
              </span>
              {selectedUnit && selectedUnit.packQty > 1 && (
                <div className="group relative">
                  <IoInformationCircleOutline className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {product?.stock || 0} base units in stock
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-red-600">Out of Stock</span>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoRemove className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= availableStock}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoAdd className="w-4 h-4" />
            </button>
          </div>
          {selectedUnit && selectedUnit.packQty > 1 && (
            <div className="text-xs text-gray-500 mt-1">
              Total base units: {quantity * selectedUnit.packQty}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={!selectedUnit || availableStock < 1}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
        </div>

        {/* SKU and Additional Info */}
        <div className="mt-4 space-y-1">
          {selectedUnit?.sku && (
            <div className="text-xs text-gray-500">
              SKU: {selectedUnit.sku}
            </div>
          )}
          {selectedUnit?.barcode && (
            <div className="text-xs text-gray-500">
              Barcode: {selectedUnit.barcode}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductCardMultiUnit;