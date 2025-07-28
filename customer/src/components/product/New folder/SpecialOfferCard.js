import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { IoAdd, IoBagAddSharp, IoRemove, IoTimeOutline, IoFlashOutline } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { useCart } from "react-use-cart";

//internal import
import useAddToCart from "@hooks/useAddToCart";
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useMultiUnits from "@hooks/useMultiUnits";
import { notifyError, notifySuccess } from "@utils/toast";
import useTranslation from 'next-translate/useTranslation';

const SpecialOfferCard = ({ product, attributes, promotion }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  
  const { handleAddItem } = useAddToCart();
  const { items, updateItemQuantity, removeItem } = useCart();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();
  const { t } = useTranslation();

  // Use the multi-units hook
  const {
    selectedUnit,
    availableUnits,
    hasMultipleUnits,
    currentUnitDisplayName,
    handleUnitSelection,
    availableStock,
    unitPricePerBase
  } = useMultiUnits(product);

  // Calculate time remaining for the promotion
  useEffect(() => {
    if (!promotion?.endDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(promotion.endDate);
      const timeDiff = endDate - now;

      if (timeDiff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''} left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`);
      } else {
        setTimeRemaining(`${minutes}m left`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [promotion?.endDate]);

  // Get cart item for this product
  const getCartItem = () => {
    return items.find((item) => item.id === product._id);
  };

  // Calculate promotional pricing
  const getPromotionalPricing = () => {
    if (!promotion) return null;

    const originalPrice = promotion.originalPrice || promotion.unit?.price || product.price || 0;
    const promotionalPrice = promotion.promotionalPrice || promotion.value || 0;
    const savings = promotion.savings || (originalPrice - promotionalPrice);
    const savingsPercent = promotion.savingsPercent || (originalPrice > 0 ? ((savings / originalPrice) * 100) : 0);
    
    // Get min/max quantities from promotion
    const minQty = promotion.minQty || promotion.minQuantity || 1;
    const maxQty = promotion.maxQty || promotion.maxQuantity || 10;
    
    // Calculate per piece price
    const pricePerPiece = promotionalPrice / minQty;
    const originalPricePerPiece = originalPrice / minQty;
    
    // Get unit information
    const unit = promotion.unit?.unit?.shortCode || 
                 promotion.unit?.unit?.name || 
                 promotion.productUnit?.unit?.shortCode ||
                 promotion.productUnit?.unit?.name ||
                 'pcs';
    
    return {
      originalPrice,
      promotionalPrice,
      pricePerPiece,
      originalPricePerPiece,
      savings,
      savingsPercent,
      minQty,
      maxQty,
      unit
    };
  };

  // Handle adding item to cart
  const handleAddToCart = () => {
    if (product?.variants?.length > 0) {
      setModalOpen(!modalOpen);
      return;
    }

    const pricing = getPromotionalPricing();
    const { slug, variants, categories, description, ...updatedProduct } = product;
    
    // Use minimum quantity for promotional items
    const quantityToAdd = pricing?.minQty || 1;
    
    const newItem = {
      ...updatedProduct,
      title: showingTranslateValue(product?.title),
      id: product.hasMultiUnits && selectedUnit ? `${product._id}-${selectedUnit._id}` : product._id,
      variant: { price: pricing?.pricePerPiece || product.price },
      price: pricing?.pricePerPiece || product.price,
      promotion: promotion,
      promotionPrice: pricing?.promotionalPrice,
      minQty: pricing?.minQty || 1,
      maxQty: pricing?.maxQty,
      basePrice: pricing?.originalPrice || product.price,
      // Multi-unit specific properties
      ...(product.hasMultiUnits && selectedUnit && {
        selectedUnitId: selectedUnit._id,
        unitName: currentUnitDisplayName,
        unitValue: selectedUnit.unitValue || 1,
        packQty: selectedUnit.packQty || 1,
        unitPrice: selectedUnit.price || 0,
        pricePerBaseUnit: unitPricePerBase,
        unitType: selectedUnit.unitType || 'multi',
        isMultiUnit: true
      }),
    };
    
    handleAddItem(newItem, quantityToAdd);
  };

  // Render rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    
    return stars;
  };

  const pricing = getPromotionalPricing();
  const existingProduct = getCartItem();

  if (!pricing) {
    return null; // Don't render if no promotional pricing
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

      <div className="relative bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border border-red-100 max-w-sm mx-auto">
        {/* Promotional Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 sm:p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <IoFlashOutline className="text-yellow-300 mr-1 text-sm" />
              <span className="text-xs sm:text-sm font-bold">SPECIAL OFFER</span>
            </div>
            <div className="flex items-center text-xs">
              <IoTimeOutline className="mr-1" />
              <span className="font-medium">{timeRemaining}</span>
            </div>
          </div>
          
          {/* Savings Badge */}
          {pricing.savingsPercent > 0 && (
            <div className="mt-1.5 inline-block bg-yellow-400 text-red-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
              SAVE {pricing.savingsPercent.toFixed(0)}% • ${getNumberTwo(pricing.savings)}
            </div>
          )}
        </div>
        
        {/* Product Image */}
        <div 
          onClick={() => setModalOpen(!modalOpen)}
          className="relative cursor-pointer h-52 sm:h-60 overflow-hidden bg-gray-50"
        >
          <Image
            src={product.image && product.image.length > 0 ? product.image[0] : '/images/placeholder.svg'}
            alt={showingTranslateValue(product?.title) || 'Product Image'}
            fill
            className="object-cover transition duration-300 transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Stock indicator */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{t('outOfStock')}</span>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-3 sm:p-3.5">
          {/* Product Title */}
          <h3 
            onClick={() => setModalOpen(!modalOpen)}
            className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 line-clamp-2 cursor-pointer hover:text-red-600 transition-colors leading-tight"
          >
            {showingTranslateValue(product?.title)}
          </h3>
          
          {/* Rating */}
          {product.ratings > 0 && (
            <div className="flex items-center mb-2 text-xs">
              <div className="flex items-center space-x-0.5">
                {renderRatingStars(product.ratings)}
              </div>
              <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                ({product.reviews || 0})
              </span>
            </div>
          )}
          
          {/* Unit Selection - Only show if multiple units available */}
          {hasMultipleUnits && (
            <div className="mb-2">
              <div className="relative">
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-left flex items-center justify-between hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-xs sm:text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={unitDropdownOpen}
                >
                  <span className="font-medium">
                    {selectedUnit ? currentUnitDisplayName : t('pleaseSelect') + ' ' + t('unit')}
                  </span>
                  <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {unitDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {availableUnits.map((unit) => (
                      <button
                        key={unit._id}
                        onClick={() => {
                          handleUnitSelection(unit);
                          setUnitDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-red-50 flex items-center justify-between transition-colors text-sm ${
                          selectedUnit?._id === unit._id ? 'bg-red-50 text-red-600' : 'text-gray-900'
                        }`}
                        role="option"
                        aria-selected={selectedUnit?._id === unit._id}
                      >
                        <div>
                          <div className="font-medium">{unit.unit?.name || unit.unit?.shortCode}</div>
                          <div className="text-xs text-gray-500">
                            {unit.packQty} {t('baseUnits')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${getNumberTwo(unit.price)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Pricing Section */}
          <div className="mb-4">
            {/* Main Pricing */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-red-600">
                    ${getNumberTwo(pricing.pricePerPiece)}
                  </span>
                  <span className="text-xs text-gray-500">/ {pricing.unit}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400 line-through">
                    ${getNumberTwo(pricing.originalPricePerPiece)}
                  </span>
                  <span className="text-xs text-gray-500">/ {pricing.unit}</span>
                </div>
              </div>
              
              {/* Quantity Info */}
              <div className="text-right">
                <div className="text-xs text-gray-600 font-medium">
                  {t('min')}: {pricing.minQty} {pricing.unit}
                </div>
                {pricing.maxQty && (
                  <div className="text-xs text-gray-500">
                    {t('max')}: {pricing.maxQty} {pricing.unit}
                  </div>
                )}
              </div>
            </div>
            
            {/* Total Promotional Price */}
            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
              <div className="text-center">
                <div className="text-xs text-red-600 font-medium mb-1">
                  {t('get')} {pricing.minQty} {pricing.unit} {t('for')}
                </div>
                <div className="text-xl font-bold text-red-700">
                  ${getNumberTwo(pricing.promotionalPrice)}
                </div>
                <div className="text-xs text-red-500">
                  {t('insteadOf')} ${getNumberTwo(pricing.originalPrice)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Add to Cart Section */}
          <div className="space-y-2">
            {product.stock <= 0 ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                {t('outOfStock')}
              </button>
            ) : existingProduct ? (
              <div className="flex items-center justify-between bg-red-50 rounded-lg p-2">
                <button
                  onClick={() => updateItemQuantity(existingProduct.id, existingProduct.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                >
                  <IoRemove />
                </button>
                <span className="font-medium text-red-700">
                  {existingProduct.quantity} {t('quantity')}
                </span>
                <button
                  onClick={() => updateItemQuantity(existingProduct.id, existingProduct.quantity + (pricing.minQty || 1))}
                  className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                >
                  <IoAdd />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
              >
                <IoBagAddSharp className="mr-2" />
                {t('addToCart')} {pricing.minQty} {pricing.unit}
              </button>
            )}
            
            {/* Promotion Details */}
            <div className="text-xs text-center text-gray-500">
              {pricing.minQty > 1 && (
                <span>{t('minimumQuantity')}: {pricing.minQty} {pricing.unit}</span>
              )}
              {pricing.maxQty && (
                <span className="ml-2">• {t('max')} {t('specialOffer')}: {pricing.maxQty} {pricing.unit}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpecialOfferCard; 