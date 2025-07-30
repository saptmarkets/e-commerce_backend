import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoChevronDown, 
  IoStarSharp,
  IoStarHalfSharp,
  IoStarOutline,
  IoHeartOutline,
  IoHeart,
  IoShareSocial,
  IoEyeOutline,
  IoShieldCheckmark,
  IoCubeOutline,
  IoTime,
  IoPricetag
} from "react-icons/io5";
import { useCart } from "react-use-cart";

// Internal imports
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";
import PromotionServices from "@services/PromotionServices";
import ProductUnitServices from "@services/ProductUnitServices";
import { getLocalizedUnitName } from "@utils/unitUtils";

const ProductCardAdvanced = ({ product, attributes, className = "" }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [productUnits, setProductUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [unitPromotions, setUnitPromotions] = useState({});
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullSpecs, setShowFullSpecs] = useState(false);

  const { items, addItem, updateItemQuantity, removeItem } = useCart();
  const { showingTranslateValue, getNumberTwo, lang } = useUtilsFunction();

  // Get current cart item for selected unit
  const getCartItem = (unitId) => {
    return items.find((item) => item.id === product._id && item.unitId === unitId);
  };

  const currentCartItem = getCartItem(selectedUnit?._id);

  // Load product data and units
  useEffect(() => {
    const loadProductData = async () => {
      if (!product._id) return;
      
      try {
        setLoading(true);
        
        // Load product units
        const unitsResponse = await ProductUnitServices.getProductUnits(product._id);
        let units = [];
        
        if (unitsResponse?.data && Array.isArray(unitsResponse.data)) {
          units = unitsResponse.data;
        } else if (Array.isArray(unitsResponse)) {
          units = unitsResponse;
        }

        if (units.length > 0) {
          setProductUnits(units);
          const defaultUnit = units.find(u => u.isDefault) || units[0];
          setSelectedUnit(defaultUnit);
          
          // Load promotions for each unit
          const promotionsMap = {};
          for (const unit of units) {
            try {
              const promotions = await PromotionServices.getPromotionsByProductUnit(unit._id);
              if (promotions && promotions.length > 0) {
                promotionsMap[unit._id] = promotions[0];
              }
            } catch (error) {
              console.error(`Error loading promotions for unit ${unit._id}:`, error);
            }
          }
          setUnitPromotions(promotionsMap);
        } else {
          // Create fallback unit
          const fallbackUnit = {
            _id: `fallback_${product._id}`,
            product: product._id,
            unit: { name: product.unit || 'pcs', shortCode: product.unit || 'pcs' },
            unitValue: 1,
            packQty: 1,
            price: product.price || 0,
            originalPrice: product.originalPrice || product.price || 0,
            stock: product.stock || 0,
            isDefault: true,
            title: `1 ${product.unit || 'pcs'}`,
            sku: product.sku || '',
            barcode: product.barcode || ''
          };
          setProductUnits([fallbackUnit]);
          setSelectedUnit(fallbackUnit);
        }
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProductData();
  }, [product._id]);

  // Get current promotion for selected unit
  const getCurrentPromotion = () => {
    if (!selectedUnit) return null;
    return unitPromotions[selectedUnit._id] || null;
  };

  // Handle unit selection
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setShowUnitDropdown(false);
    setQuantity(1); // Reset quantity when changing units
  };

  // Calculate pricing information
  const getPricingInfo = () => {
    if (!selectedUnit) return null;
    
    const promotion = getCurrentPromotion();
    const basePrice = selectedUnit.price || 0;
    const originalPrice = selectedUnit.originalPrice || basePrice;
    
    let finalPrice = basePrice;
    let hasDiscount = false;
    let discountPercentage = 0;
    let promotionText = null;
    
    // Check for promotions
    if (promotion) {
      if (promotion.type === 'fixed_price') {
        finalPrice = promotion.value;
        hasDiscount = finalPrice < basePrice;
        discountPercentage = basePrice > 0 ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;
        promotionText = `Special Price!`;
      } else if (promotion.type === 'bulk_purchase') {
        promotionText = `Buy ${promotion.requiredQty} get ${promotion.freeQty} free!`;
      }
    } else if (originalPrice > basePrice) {
      // Regular discount
      hasDiscount = true;
      discountPercentage = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
    }
    
    return {
      finalPrice,
      originalPrice: hasDiscount ? originalPrice : null,
      basePrice,
      hasDiscount,
      discountPercentage,
      promotion,
      promotionText,
      perUnitPrice: finalPrice / (selectedUnit.packQty || 1)
    };
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!selectedUnit) return notifyError("Please select a unit!");
    
    // Enhanced stock validation
    if (!isUnitAvailable) {
      const packQty = selectedUnit.packQty || 1;
      if (product.stock === 0) {
        return notifyError("Product is out of stock!");
      } else if (availableStock === 0) {
        return notifyError(`Insufficient stock for ${selectedUnit.unitTitle || getLocalizedUnitName(selectedUnit.unit, lang)}. Need ${packQty} pieces but only ${product.stock} available. Try smaller units.`);
      }
      return notifyError("This unit is not available!");
    }
    
    if (quantity > availableStock) {
      return notifyError(`Only ${availableStock} ${selectedUnit.unitTitle || getLocalizedUnitName(selectedUnit.unit, lang)} available!`);
    }
    
    const promotion = getCurrentPromotion();
    const pricingInfo = getPricingInfo();
    
    let quantityToAdd = quantity;
    if (promotion && promotion.minQty > 1) {
      quantityToAdd = Math.max(quantity, promotion.minQty);
      if (quantityToAdd > availableStock) {
        return notifyError(`Promotion requires ${promotion.minQty} units but only ${availableStock} available!`);
      }
    }
    
    const cartItem = {
      id: product._id,
      unitId: selectedUnit._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: pricingInfo.finalPrice,
      basePrice: pricingInfo.basePrice,
      unit: selectedUnit,
      promotion: promotion,
      stock: availableStock, // Use calculated available stock
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      unitTitle: selectedUnit.title || `${selectedUnit.packQty || 1} ${getLocalizedUnitName(selectedUnit.unit, lang)}`,
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantityToAdd);
    } else {
      addItem(cartItem, quantityToAdd);
    }
    
    notifySuccess(`Added ${quantityToAdd} ${cartItem.unitTitle} to cart!`);
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    } else if (newQuantity > availableStock) {
      notifyError(`Only ${availableStock} ${selectedUnit?.unitTitle || selectedUnit?.unit?.name || 'units'} available!`);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<IoStarSharp key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<IoStarHalfSharp key={i} className="text-yellow-400" />);
      } else {
        stars.push(<IoStarOutline key={i} className="text-gray-300" />);
      }
    }
    
    return stars;
  };

  // Get product images for gallery
  const getProductImages = () => {
    if (product.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image;
    }
          return [''];
  };

  const images = getProductImages();
  const pricingInfo = getPricingInfo();
  const rating = product.rating || 4.2; // Default rating
  const reviewCount = product.reviewCount || Math.floor(Math.random() * 1000) + 50;

  // Calculate available stock for current unit
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    const packQty = selectedUnit.packQty || 1;
    const availableUnits = Math.floor(product.stock / packQty);
    
    // Log for debugging
    if (product.stock > 0 && availableUnits === 0) {
      console.log(`Product has stock (${product.stock}) but insufficient for unit:`, {
        productStock: product.stock,
        unitPackQty: packQty,
        availableUnits: availableUnits,
        unitName: selectedUnit.unitTitle || selectedUnit.unit?.name
      });
    }
    
    return availableUnits;
  }, [selectedUnit, product?.stock]);

  // Check if current unit is valid for purchase
  const isUnitAvailable = useMemo(() => {
    return selectedUnit && availableStock > 0;
  }, [selectedUnit, availableStock]);

  // Get stock status message
  const getStockMessage = () => {
    if (!selectedUnit) return "Please select a unit";
    if (!product?.stock || product.stock === 0) return "Out of stock";
    if (availableStock === 0) {
      const packQty = selectedUnit.packQty || 1;
      return `Insufficient stock for ${selectedUnit.unitTitle || getLocalizedUnitName(selectedUnit.unit, lang)}. Need ${packQty} pieces but only ${product.stock} available. Try smaller units.`;
    }
    return `${availableStock} ${selectedUnit.unitTitle || getLocalizedUnitName(selectedUnit.unit, lang)} available`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 animate-pulse ${className}`}>
        <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
        />
      )}

      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${className}`}>
        {/* Header with favorite and share */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            {pricingInfo?.hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {pricingInfo.discountPercentage}% OFF
              </span>
            )}
            {pricingInfo?.promotionText && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                <IoPricetag className="inline w-3 h-3 mr-1" />
                OFFER
              </span>
            )}
          </div>
          <div className="flex space-x-2">
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
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <IoShareSocial className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Product Image Gallery */}
        <div className="mb-6">
          <div className="relative h-64 mb-3 cursor-pointer" onClick={() => setModalOpen(true)}>
            <Image
              src={images[selectedImageIndex]}
              alt={showingTranslateValue(product?.title)}
              fill
              className="object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded text-xs">
              <IoEyeOutline className="w-4 h-4" />
            </div>
          </div>
          
          {/* Image thumbnails */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${showingTranslateValue(product?.title)} ${index + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Title and Rating */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {showingTranslateValue(product?.title)}
        </h3>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center space-x-1">
            {renderStars(rating)}
          </div>
          <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({reviewCount.toLocaleString()} reviews)</span>
        </div>

        {/* Unit Selection */}
        {productUnits.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Size
            </label>
            <div className="relative">
              <button
                onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {selectedUnit?.title || `${selectedUnit?.packQty || 1} ${getLocalizedUnitName(selectedUnit?.unit, lang)}`}
                  </span>
                  {pricingInfo && (
                    <span className="text-sm text-gray-500">
                      ${getNumberTwo(pricingInfo.perUnitPrice)} per {getLocalizedUnitName(selectedUnit?.unit, lang)}
                    </span>
                  )}
                </div>
                <IoChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showUnitDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showUnitDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {productUnits.map((unit) => {
                    const unitPromotion = unitPromotions[unit._id];
                    const unitPrice = unitPromotion?.type === 'fixed_price' ? unitPromotion.value : unit.price;
                    const perUnitPrice = unitPrice / (unit.packQty || 1);
                    
                    // Calculate availability for this unit
                    const packQty = unit.packQty || 1;
                    const unitAvailableStock = Math.floor((product.stock || 0) / packQty);
                    const isUnitStockAvailable = unitAvailableStock > 0;
                    
                    return (
                      <button
                        key={unit._id}
                        onClick={() => handleUnitChange(unit)}
                        disabled={!isUnitStockAvailable}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedUnit?._id === unit._id ? 'bg-blue-50 border-blue-200' : ''
                        } ${!isUnitStockAvailable ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className={`font-medium ${!isUnitStockAvailable ? 'text-gray-400' : ''}`}>
                              {unit.title || `${unit.packQty || 1} ${getLocalizedUnitName(unit.unit, lang)}`}
                            </span>
                            <span className={`text-sm ${!isUnitStockAvailable ? 'text-gray-400' : 'text-gray-500'}`}>
                              ${getNumberTwo(perUnitPrice)} per {getLocalizedUnitName(unit.unit, lang)}
                            </span>
                            {!isUnitStockAvailable && (
                              <span className="text-xs text-red-500 mt-1">
                                Insufficient stock (need {packQty}, have {product.stock || 0})
                              </span>
                            )}
                            {isUnitStockAvailable && unitAvailableStock <= 5 && (
                              <span className="text-xs text-orange-600 mt-1">
                                Only {unitAvailableStock} available
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`font-bold text-lg ${!isUnitStockAvailable ? 'text-gray-400' : ''}`}>
                              ${getNumberTwo(unitPrice)}
                            </span>
                            {unitPromotion && isUnitStockAvailable && (
                              <div className="text-xs text-orange-600 font-medium">
                                Special Price
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        {pricingInfo && (
          <div className="mb-4">
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-bold text-gray-900">
                ${getNumberTwo(pricingInfo.finalPrice)}
              </span>
              {pricingInfo.originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${getNumberTwo(pricingInfo.originalPrice)}
                </span>
              )}
            </div>
            {pricingInfo.promotionText && (
              <p className="text-sm text-orange-600 font-medium mt-1">
                {pricingInfo.promotionText}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              ${getNumberTwo(pricingInfo.perUnitPrice)} per {getLocalizedUnitName(selectedUnit?.unit, lang)}
            </p>
          </div>
        )}

        {/* Stock Status */}
        <div className="mb-4">
          {isUnitAvailable ? (
            <div className="flex items-center space-x-2 text-green-600">
              <IoShieldCheckmark className="w-4 h-4" />
              <span className="text-sm font-medium">
                {getStockMessage()}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <IoTime className="w-4 h-4" />
              <span className="text-sm font-medium">{getStockMessage()}</span>
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        {isUnitAvailable && (
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={handleAddToCart}
            disabled={!selectedUnit || !isUnitAvailable}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
          <button
            onClick={() => {
              handleAddToCart();
              // Could navigate to checkout here
            }}
            disabled={!selectedUnit || !isUnitAvailable}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Buy Now
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <IoCubeOutline className="w-4 h-4" />
            <span>Free delivery above $50</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <IoShieldCheckmark className="w-4 h-4" />
            <span>Quality guarantee</span>
          </div>
          {selectedUnit?.sku && (
            <div className="text-xs text-gray-500">
              SKU: {selectedUnit.sku}
            </div>
          )}
        </div>

        {/* Product Specs Toggle */}
        {product.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowFullSpecs(!showFullSpecs)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="font-medium text-gray-900">Product Details</span>
              <IoChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFullSpecs ? 'rotate-180' : ''}`} />
            </button>
            {showFullSpecs && (
              <div className="mt-3 text-sm text-gray-600">
                <p>{showingTranslateValue(product.description)}</p>
                {product.ingredients && (
                  <div className="mt-2">
                    <strong>Ingredients:</strong> {product.ingredients}
                  </div>
                )}
                {product.nutritionalInfo && (
                  <div className="mt-2">
                    <strong>Nutritional Info:</strong> {product.nutritionalInfo}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCardAdvanced; 