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
  IoGiftOutline
} from "react-icons/io5";
import { useCart } from "react-use-cart";
import { motion, AnimatePresence } from "framer-motion";
import useTranslation from 'next-translate/useTranslation';

// Internal imports
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";
import ProductUnitServices from "@services/ProductUnitServices";
import PromotionServices from "@services/PromotionServices";
import NeonSpinner from "@components/preloader/NeonSpinner";
import { getUnitDisplayName, getShortUnitName } from "@utils/unitUtils";

const ProductDetailCardEnhanced = ({ 
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
  const [imageError, setImageError] = useState(false);
  // Track if promotions have been checked for the current unit
  const [hasCheckedUnitPromotion, setHasCheckedUnitPromotion] = useState(false);

  // 🔥 Promo tracking for all units
  const [promotionalUnits, setPromotionalUnits] = useState(new Set());
  const [allPromotions, setAllPromotions] = useState([]);

  // Scan every available unit for promotions so we can decorate buttons
  useEffect(() => {
    const scanUnitsForPromos = async () => {
      if (!availableUnits.length) return;

      const promoIds = new Set();
      const promoData = [];

      for (const unit of availableUnits) {
        if (unit._id.startsWith('fallback-') || unit._id.startsWith('default-')) continue;

        try {
          const unitPromos = await PromotionServices.getPromotionsByProductUnit(unit._id);
          if (unitPromos && unitPromos.length) {
            promoIds.add(unit._id);
            promoData.push(...unitPromos.map(p => ({ ...p, unitId: unit._id })));
          }
        } catch (err) {
          console.warn('Unit promo scan error', unit._id, err);
        }
      }

      setPromotionalUnits(promoIds);
      setAllPromotions(promoData);
    };

    scanUnitsForPromos();
  }, [availableUnits]);

  const { items, addItem, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo, currency, lang } = useUtilsFunction();
  const { t } = useTranslation('common');

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

  // Fetch promotions specific to the selected unit whenever it changes
  useEffect(() => {
    if (!selectedUnit?._id) return;

    // Ignore system generated units
    if (selectedUnit._id.startsWith('fallback-') || selectedUnit._id.startsWith('default-')) {
      setActivePromotion(null);
      return;
    }

    const fetchUnitPromotions = async () => {
      try {
        const unitPromos = await PromotionServices.getPromotionsByProductUnit(selectedUnit._id);
        if (unitPromos && unitPromos.length > 0) {
          setActivePromotion(unitPromos[0]);
        } else {
          // No unit promo — keep any product-level promo already fetched
          if (activePromotion && activePromotion.productUnit && activePromotion.productUnit._id !== selectedUnit._id) {
            setActivePromotion(null);
          }
        }
      } catch (err) {
        console.error('Error fetching unit promotions:', err);
      }
    };

    fetchUnitPromotions();
  }, [selectedUnit]);

  // Auto-adjust quantity to meet minimum promotion requirements once promotion data is available
  useEffect(() => {
    if (!activePromotion) return;

    const minQty = activePromotion.minQty || activePromotion.requiredQty || 1;

    // If current quantity is less than the promotion's minimum requirement, bump it up automatically
    if (quantity < minQty) {
      setQuantity(minQty);
    }
  }, [activePromotion, selectedUnit, quantity]);

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
    if (!selectedUnit) return { basePrice: 0, finalPrice: 0, savings: 0, isPromotional: false, pricePerBaseUnit: 0 };

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;

    // Apply promotion if available and meets quantity requirements (like the small product card)
    if (activePromotion && quantity >= (activePromotion.minQty || activePromotion.requiredQty || 1)) {
      const isUnitSpecificPromotion = activePromotion.productUnit && activePromotion.productUnit._id === selectedUnit._id;
      const isGeneralPromotion = !activePromotion.productUnit || activePromotion.product === product._id;

      if (isUnitSpecificPromotion || isGeneralPromotion) {
        if (activePromotion.type === 'fixed_price') {
          const promoPrice = activePromotion.value || activePromotion.offerPrice || basePrice;
          const maxQty = activePromotion.maxQty || null;

          if (maxQty && quantity > maxQty) {
            // Beyond maxQty we revert to regular price for the excess
            const promoPortion = promoPrice * maxQty;
            const regularPortion = basePrice * (quantity - maxQty);
            finalPrice = (promoPortion + regularPortion) / quantity;
          } else {
            finalPrice = promoPrice;
          }

          const originalPrice = activePromotion.originalPrice || activePromotion.productUnit?.price || basePrice;
          savings = Math.max(0, originalPrice - promoPrice);
          isPromotional = true;
        } else if (activePromotion.type === 'bulk_purchase') {
          const totalRequired = activePromotion.requiredQty || activePromotion.minQty || 1;
          const freeQty = activePromotion.freeQty || 0;
          const originalPrice = activePromotion.originalPrice || 
                               activePromotion.productUnit?.price || 
                               basePrice;
          const effectivePrice = (originalPrice * totalRequired) / (totalRequired + freeQty);
          finalPrice = effectivePrice;
          savings = Math.max(0, originalPrice - effectivePrice);
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

  // Event handlers
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
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
      price: pricingInfo.finalPrice,
      basePrice: pricingInfo.basePrice,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      unitName: selectedUnit.unit?.name || 'Unit',
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      promotion: activePromotion,
      isPromotional: pricingInfo.isPromotional,
      savings: pricingInfo.savings,
      minQty: activePromotion?.minQty || 1,
      maxQty: activePromotion?.maxQty || null
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantityToAdd);
    } else {
      addItem(cartItem, quantityToAdd);
    }
    
    const unitDisplayName = getUnitDisplayName(selectedUnit, lang);
    notifySuccess(`${t('added')} ${quantityToAdd} ${unitDisplayName} ${t('toCart')}!`);
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
        <label className="text-sm font-semibold text-gray-800">{t('selectPackage')}</label>
        {isLoadingUnits && (
                                  <NeonSpinner size="xs" />
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {availableUnits.map((unit) => {
          const isSelected = selectedUnit?._id === unit._id;
          const unitPrice = unit.price || 0;
          const pricePerBase = unit.packQty ? unitPrice / unit.packQty : unitPrice;
          

          
          return (
            <motion.button
              key={unit._id}
              onClick={() => handleUnitChange(unit)}
              className={`
                relative p-3 border-2 rounded-lg text-left transition-all duration-200
                ${isSelected 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      {unit.unitValue || 1} {getUnitDisplayName(unit, lang)}
                    </span>
                    {isSelected && <IoCheckmarkCircle className="text-emerald-500" />}
                  </div>
                  {unit.packQty > 1 && (
                    <div className="text-sm text-gray-500">
                      {t('contains')} {unit.packQty} {t('baseUnits')}
                    </div>
                  )}
                </div>
                {/* Price block */}
                <div className="text-right">
                  {(() => {
                    // Try to find a promotion for this unit first in activePromotion, then in cached list
                    const unitPromo = (activePromotion && activePromotion.productUnit && activePromotion.productUnit._id === unit._id)
                      ? activePromotion
                      : allPromotions.find(p => p.unitId === unit._id);

                    if (unitPromo) {
                      const promoPrice = unitPromo.value || unitPromo.offerPrice || unitPrice;
                      const minQtyPromo = unitPromo.minQty || unitPromo.requiredQty || 1;

                      return (
                        <div className="space-y-0.5 text-right">
                          <div className="flex items-baseline justify-end space-x-1">
                            <span className="font-bold text-red-600">{currency}{promoPrice.toFixed(2)}</span>
                            <span className="text-xs line-through text-gray-400">{currency}{unitPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-red-600">🔥 {t('min')} {minQtyPromo}</div>
                        </div>
                      );
                    }

                    // No promotion – regular price
                    return (
                      <>
                        <div className="font-bold text-emerald-600">
                          {currency}{unitPrice.toFixed(2)}
                        </div>
                        {unit.packQty > 1 && (
                          <div className="text-xs text-gray-500">
                            {currency}{pricePerBase.toFixed(2)}/unit
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedUnit?._id}-${pricingInfo.isPromotional}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {pricingInfo.isPromotional ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <IoFlashOutline className="text-red-500" />
                <span className="text-sm font-medium text-red-600">{t('specialOffer')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-red-600">
                  {currency}{pricingInfo.finalPrice.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {currency}{pricingInfo.basePrice.toFixed(2)}
                </span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                  {t('save')} {currency}{pricingInfo.savings.toFixed(2)}
                </span>
              </div>
            </div>
          ) : activePromotion && quantity < (activePromotion.minQty || 1) ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {currency}{pricingInfo.finalPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">{t('perPackage')}</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <IoFlashOutline className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {t('buy')} {activePromotion.minQty || 1} {getUnitDisplayName(activePromotion.productUnit || selectedUnit, lang)} {t('or')} {t('more')} {t('for')} {currency}{(activePromotion.value || activePromotion.offerPrice || pricingInfo.basePrice).toFixed(2)} {t('each')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-emerald-600">
                {currency}{pricingInfo.finalPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">{t('perPackage')}</span>
            </div>
          )}
          
          {selectedUnit?.packQty > 1 && (
            <div className="text-sm text-gray-600 mt-1">
              {currency}{pricingInfo.pricePerBaseUnit.toFixed(2)} {t('perBaseUnit')}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderPromotionBadge = () => {
    if (!activePromotion || !pricingInfo.isPromotional) return null;

    return (
      <motion.div
        className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <div className="flex items-center space-x-1">
          <IoGiftOutline size={14} />
          <span className="text-xs font-bold">
            {activePromotion.type === 'bulk_purchase' 
              ? `${t('buy')} ${activePromotion.requiredQty} ${t('get')} ${activePromotion.freeQty} ${t('free')}`
              : t('specialPrice')
            }
          </span>
        </div>
      </motion.div>
    );
  };

  const renderQuantitySelector = () => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-3">{t('quantity')}</label>
      <div className="flex items-center space-x-3">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="p-2 text-gray-600 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoRemove size={18} />
          </button>
          <span className="px-4 py-2 font-semibold min-w-[60px] text-center">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= availableStock}
            className="p-2 text-gray-600 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoAdd size={18} />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {availableStock > 0 ? (
            `${availableStock} ${t('available')}`
          ) : (
            <span className="text-red-500">{t('outOfStock')}</span>
          )}
        </div>
      </div>
    </div>
  );

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

      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        {/* Product Image Section */}
        <div className="relative">
          {renderPromotionBadge()}
          
          <div 
            className="relative aspect-square bg-gray-100 cursor-pointer group"
            onClick={() => handleImageClick()}
          >
            {!imageError && (product.image?.[selectedImageIndex] || product.image?.[0]) ? (
              <Image
                src={product.image?.[selectedImageIndex] || product.image?.[0]}
                alt={showingTranslateValue(product?.title) || 'Product Image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => {
                  setImageError(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">{t('noImageAvailable')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Image thumbnails */}
          {product.image && product.image.length > 1 && (
            <div className="flex space-x-2 p-3 bg-white">
              {product.image.slice(0, 4).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex ? 'border-emerald-500' : 'border-gray-200'
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
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
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
            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
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
                  ({product.reviewCount || 0} {t('reviews')})
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

          {/* Product Description */}
          {showFullDescription && product.description && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">{t('description')}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {showingTranslateValue(product.description)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              onClick={handleAddToCart}
              disabled={availableStock === 0 || !selectedUnit}
              className="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg font-semibold
                        hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {availableStock === 0 ? t('outOfStock') : `${t('addToCart')} • ${currency}${(pricingInfo.finalPrice * quantity).toFixed(2)}`}
            </motion.button>

            <button
              onClick={() => handleImageClick()}
              className="w-full border-2 border-emerald-500 text-emerald-500 py-3 px-6 rounded-lg font-semibold
                        hover:bg-emerald-50 transition-colors duration-200"
            >
              View Details
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>SKU: {product.sku || 'N/A'}</span>
            {product.stock && (
              <span>{product.stock} in stock</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailCardEnhanced; 