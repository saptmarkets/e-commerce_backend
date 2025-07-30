import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoHeartOutline,
  IoHeart,
  IoCheckmarkCircle,
  IoInformationCircleOutline,
  IoStarSharp,
  IoFlashOutline,
  IoGiftOutline,
  IoChevronDown
} from "react-icons/io5";
import { useCart } from "react-use-cart";

// Internal imports
import useAddToCart from "@hooks/useAddToCart";
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";
import ProductUnitServices from "@services/ProductUnitServices";
import PromotionServices from "@services/PromotionServices";
import NeonSpinner from "@components/preloader/NeonSpinner";
import { getLocalizedUnitName } from "@utils/unitUtils";

const ProductCardAdvancedDynamic = ({ 
  product, 
  attributes = [], 
  className = "",
  onImageClick = null,
  showFullDescription = false 
}) => {
  // State management
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [activePromotion, setActivePromotion] = useState(null);
  const [isLoadingPromotion, setIsLoadingPromotion] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [priceUpdateKey, setPriceUpdateKey] = useState(0);

  const { handleAddItem } = useAddToCart();
  const { items, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo, currency, lang } = useUtilsFunction();

  // Fetch available units and promotions
  useEffect(() => {
    const fetchProductData = async () => {
      if (!product?._id) return;

      // Fetch units
      await fetchProductUnits();
      
      // Fetch promotions
      await fetchPromotions();
    };

    fetchProductData();
  }, [product?._id]);

  const fetchProductUnits = async () => {
    if (!product?.hasMultiUnits) {
      // Create default unit for single-unit products
      const defaultUnit = {
        _id: `default-${product._id}`,
        product: product._id,
        unit: product?.basicUnit || { name: 'Unit', shortCode: 'pcs' },
        unitValue: 1,
        packQty: 1,
        price: product?.price || 0,
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
        const defaultUnit = units.find(unit => unit.isDefault && unit.isActive) || 
                           units.find(unit => unit.isActive) ||
                           units[0];
        setSelectedUnit(defaultUnit);
      }
    } catch (error) {
      console.error('Error fetching product units:', error);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const fetchPromotions = async () => {
    setIsLoadingPromotion(true);
    try {
      const promotions = await PromotionServices.getPromotionsForProduct(product._id);
      if (promotions && promotions.length > 0) {
        setActivePromotion(promotions[0]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoadingPromotion(false);
    }
  };

  // Calculations
  const currentCartItem = useMemo(() => {
    if (!selectedUnit) return null;
    return items.find((item) => 
      item.productId === product._id && 
      item.selectedUnitId === selectedUnit._id
    );
  }, [items, product._id, selectedUnit]);

  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / (selectedUnit.packQty || 1));
  }, [selectedUnit, product?.stock]);

  const pricingInfo = useMemo(() => {
    if (!selectedUnit) return { basePrice: 0, finalPrice: 0, savings: 0, isPromotional: false };

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;

    // Apply promotion if available and valid
    if (activePromotion && quantity >= (activePromotion.minQty || 1)) {
      if (activePromotion.type === 'fixed_price') {
        finalPrice = activePromotion.value || basePrice;
        savings = basePrice - finalPrice;
        isPromotional = true;
      } else if (activePromotion.type === 'bulk_purchase') {
        // For bulk purchases, calculate effective price considering free items
        const totalRequired = activePromotion.requiredQty || 1;
        const freeQty = activePromotion.freeQty || 0;
        const effectivePrice = (basePrice * totalRequired) / (totalRequired + freeQty);
        finalPrice = effectivePrice;
        savings = basePrice - effectivePrice;
        isPromotional = true;
      }
    }

    return { 
      basePrice, 
      finalPrice: Math.max(0, finalPrice), 
      savings: Math.max(0, savings), 
      isPromotional,
      pricePerBaseUnit: selectedUnit.packQty ? finalPrice / selectedUnit.packQty : finalPrice
    };
  }, [selectedUnit, activePromotion, quantity]);

  // Event handlers
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1);
    setShowUnitDropdown(false);
    setPriceUpdateKey(prev => prev + 1); // Trigger price animation
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
      setPriceUpdateKey(prev => prev + 1); // Trigger price animation
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
      price: pricingInfo.finalPrice,
      basePrice: pricingInfo.basePrice,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      // Multi-unit information
      unitName: getLocalizedUnitName(selectedUnit.unit, lang),
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      unitPrice: selectedUnit.price || 0,
      baseProductPrice: product.price || 0,
      // Additional metadata
      unitType: selectedUnit.unitType || 'multi',
      isMultiUnit: product?.hasMultiUnits || Boolean(selectedUnit.packQty > 1)
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantity);
    } else {
      handleAddItem(cartItem, quantity);
    }
  };

  const handleImageClick = (targetImageIndex = null) => {
    if (onImageClick) {
      onImageClick();
    } else {
      if (targetImageIndex !== null) {
        setSelectedImageIndex(targetImageIndex);
      }
      setModalOpen(true);
    }
  };

  // Render helpers
  const renderUnitSelector = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-800">Package Size</label>
        {isLoadingUnits && (
                          <NeonSpinner size="xs" />
        )}
      </div>
      
      {availableUnits.length <= 3 ? (
        // Grid layout for few units
        <div className="grid grid-cols-1 gap-2">
          {availableUnits.map((unit) => {
            const isSelected = selectedUnit?._id === unit._id;
            const unitPrice = unit.price || 0;
            const pricePerBase = unit.packQty ? unitPrice / unit.packQty : unitPrice;
            
            return (
              <button
                key={unit._id}
                onClick={() => handleUnitChange(unit)}
                className={`
                  relative p-3 border-2 rounded-lg text-left transition-all duration-200 transform hover:scale-[1.02]
                  ${isSelected 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">
                        {unit.unitValue || 1} {getLocalizedUnitName(unit.unit, lang)}
                      </span>
                      {isSelected && <IoCheckmarkCircle className="text-emerald-500" />}
                    </div>
                    {unit.packQty > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Contains {unit.packQty} base units
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">
                      {currency}{unitPrice.toFixed(2)}
                    </div>
                    {unit.packQty > 1 && (
                      <div className="text-xs text-gray-500">
                        {currency}{pricePerBase.toFixed(2)}/unit
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // Dropdown for many units
        <div className="relative">
          <button
            onClick={() => setShowUnitDropdown(!showUnitDropdown)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg text-left bg-white hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800">
                  {selectedUnit?.unitValue || 1} {getLocalizedUnitName(selectedUnit?.unit, lang)}
                </span>
                {selectedUnit?.packQty > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Contains {selectedUnit.packQty} base units
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-600">
                  {currency}{(selectedUnit?.price || 0).toFixed(2)}
                </span>
                <IoChevronDown className={`transition-transform duration-200 ${showUnitDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </button>
          
          {showUnitDropdown && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {availableUnits.map((unit) => {
                const unitPrice = unit.price || 0;
                const pricePerBase = unit.packQty ? unitPrice / unit.packQty : unitPrice;
                
                return (
                  <button
                    key={unit._id}
                    onClick={() => handleUnitChange(unit)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">
                          {unit.unitValue || 1} {getLocalizedUnitName(unit.unit, lang)}
                        </span>
                        {unit.packQty > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Contains {unit.packQty} base units
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          {currency}{unitPrice.toFixed(2)}
                        </div>
                        {unit.packQty > 1 && (
                          <div className="text-xs text-gray-500">
                            {currency}{pricePerBase.toFixed(2)}/unit
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
      )}
    </div>
  );

  const renderPricing = () => (
    <div className="mb-6">
      <div
        key={priceUpdateKey}
        className="animate-pulse-gentle"
        style={{
          animation: 'pulse-gentle 0.3s ease-in-out'
        }}
      >
        {pricingInfo.isPromotional ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <IoFlashOutline className="text-red-500" />
              <span className="text-sm font-medium text-red-600">Special Offer</span>
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <span className="text-2xl font-bold text-red-600">
                {currency}{pricingInfo.finalPrice.toFixed(2)}
              </span>
              <span className="text-lg text-gray-500 line-through">
                {currency}{pricingInfo.basePrice.toFixed(2)}
              </span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                Save {currency}{pricingInfo.savings.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-emerald-600">
              {currency}{pricingInfo.finalPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">per package</span>
          </div>
        )}
        
        {selectedUnit?.packQty > 1 && (
          <div className="text-sm text-gray-600 mt-1">
            {currency}{pricingInfo.pricePerBaseUnit.toFixed(2)} per base unit
          </div>
        )}
      </div>
    </div>
  );

  const renderPromotionBadge = () => {
    if (!activePromotion || !pricingInfo.isPromotional) return null;

    return (
      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full z-10 animate-bounce-gentle">
        <div className="flex items-center space-x-1">
          <IoGiftOutline size={14} />
          <span className="text-xs font-bold">
            {activePromotion.type === 'bulk_purchase' 
              ? `Buy ${activePromotion.requiredQty} Get ${activePromotion.freeQty} Free`
              : 'Special Price'
            }
          </span>
        </div>
      </div>
    );
  };

  const renderQuantitySelector = () => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-3">Quantity</label>
      <div className="flex items-center space-x-3">
        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="p-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <IoRemove size={18} />
          </button>
          <span className="px-4 py-3 font-semibold min-w-[60px] text-center bg-gray-50">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= availableStock}
            className="p-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <IoAdd size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {availableStock > 0 ? (
            <span className="text-emerald-600 font-medium">{availableStock} available</span>
          ) : (
            <span className="text-red-500 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderTotalPrice = () => {
    const totalPrice = (pricingInfo.finalPrice * quantity).toFixed(2);
    const totalSavings = (pricingInfo.savings * quantity).toFixed(2);
    
    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Price:</span>
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-600">
              {currency}{totalPrice}
            </span>
            {pricingInfo.isPromotional && parseFloat(totalSavings) > 0 && (
              <div className="text-xs text-red-600">
                Total savings: {currency}{totalSavings}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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

      <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className}`}>
        {/* Product Image Section */}
        <div className="relative">
          {renderPromotionBadge()}
          
          <div 
            className="relative h-80 bg-gray-100 cursor-pointer group overflow-hidden"
            onClick={() => handleImageClick()}
          >
            <Image
              src={product.image?.[selectedImageIndex] || product.image?.[0] || '/images/placeholder.svg'}
              alt={showingTranslateValue(product?.title) || 'Product Image'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
          </div>

          {/* Image thumbnails */}
          {product.image && product.image.length > 1 && (
            <div className="flex space-x-2 p-3 bg-white">
              {product.image.slice(0, 4).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex ? 'border-emerald-500 shadow-md scale-105' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all z-10 hover:scale-110"
          >
            {isFavorite ? (
              <IoHeart className="text-red-500" size={20} />
            ) : (
              <IoHeartOutline className="text-gray-600" size={20} />
            )}
          </button>
        </div>

        {/* Product Info Section */}
        <div className="p-6">
          {/* Title and Rating */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => handleImageClick()}>
              {showingTranslateValue(product?.title)}
            </h3>
            
            {product.rating && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <IoStarSharp
                      key={i}
                      className={i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}
                      size={16}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({product.reviewCount || 0} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Unit Selector */}
          {availableUnits.length > 1 && renderUnitSelector()}

          {/* Pricing */}
          {renderPricing()}

          {/* Quantity Selector */}
          {renderQuantitySelector()}

          {/* Total Price */}
          {renderTotalPrice()}

          {/* Product Description */}
          {showFullDescription && product.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {showingTranslateValue(product.description)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={availableStock === 0 || !selectedUnit}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold
                        hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed
                        transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                        shadow-lg hover:shadow-xl"
            >
              {availableStock === 0 ? 'Out of Stock' : `Add to Cart • ${currency}${(pricingInfo.finalPrice * quantity).toFixed(2)}`}
            </button>

            <button
              onClick={() => handleImageClick()}
              className="w-full border-2 border-emerald-500 text-emerald-500 py-3 px-6 rounded-lg font-semibold
                        hover:bg-emerald-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              View Details
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 border-t pt-4">
            <span>SKU: {product.sku || 'N/A'}</span>
            {product.stock && (
              <span>{product.stock} in stock</span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-gentle {
          0% { opacity: 0.7; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 0.3s ease-in-out;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default ProductCardAdvancedDynamic; 