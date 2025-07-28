import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoAdd, IoRemove, IoTimeOutline, IoFlashOutline, IoBagAddSharp } from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from 'react-use-cart';
import useTranslation from 'next-translate/useTranslation';

// Internal imports
import useAddToCart from '@hooks/useAddToCart';
import useUtilsFunction from '@hooks/useUtilsFunction';
import { notifySuccess, notifyError } from '@utils/toast';

const ComboOfferCard = ({ promotion }) => {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { handleAddItem } = useAddToCart();
  const { t } = useTranslation('common');
  const { showingTranslateValue, getNumberTwo, currency, lang, tr } = useUtilsFunction();

  // Safety check for promotion data
  if (!promotion || !promotion._id) {
    return null;
  }

  // Ensure promotion name is properly translated
  const promotionName = showingTranslateValue(promotion.name) || tr('Mega Combo Deal','صفقة مجمعة كبيرة');

  // Calculate time remaining for the promotion
  useEffect(() => {
    if (!promotion?.endDate) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(promotion.endDate);
      const timeDiff = endDate - now;

      if (timeDiff <= 0) {
        setTimeRemaining(tr('Expired','انتهى'));
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} ${tr('day','يوم')}${days > 1 ? tr('s','') : ''} ${tr('left','المتبقية')}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`);
      } else {
        setTimeRemaining(`${minutes}m left`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [promotion?.endDate]);

  // Auto-rotate carousel with custom loop behavior
  useEffect(() => {
    if (!promotion?.products || promotion.products.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => {
          // If we've reached the last image, reset to the first
          if (prev >= promotion.products.length - 1) {
            return 0; // Reset to first image
          }
          return prev + 1;
        });
        setIsAnimating(false);
      }, 150);
    }, 4000); // Increased delay to match other carousels

    return () => clearInterval(interval);
  }, [promotion?.products]);

  // Get available products from promotion
  const availableProducts = promotion?.products || [];
  
  // Calculate total selected quantity
  const totalSelectedQty = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
  
  // Calculate remaining items needed
  const requiredQty = promotion?.requiredItemCount || 5;
  const remainingQty = Math.max(0, requiredQty - totalSelectedQty);
  
  // Calculate pricing
  const calculatePricing = () => {
    const basePrice = promotion?.value || 0;
    const pricePerItem = promotion?.pricePerItem || (basePrice / requiredQty);
    
    if (totalSelectedQty < requiredQty) {
      // Below minimum - no pricing calculation
      return {
        isComboPrice: false,
        totalPrice: 0,
        pricePerItem: pricePerItem,
        showMessage: true,
        message: `${tr('Select','اختر')} ${requiredQty - totalSelectedQty} ${tr('more items','عناصر إضافية')}`
      };
    } else if (totalSelectedQty === requiredQty) {
      // Exact combo quantity
      return {
        isComboPrice: true,
        totalPrice: basePrice,
        pricePerItem: pricePerItem,
        showMessage: false
      };
    } else {
      // Exceeding combo limit - charge combo price + individual unit prices for extra
      const comboPrice = basePrice;
      const extraItems = totalSelectedQty - requiredQty;
      const extraPrice = extraItems * pricePerItem;
      
      return {
        isComboPrice: false,
        totalPrice: comboPrice + extraPrice,
        comboPrice: comboPrice,
        extraPrice: extraPrice,
        extraItems: extraItems,
        pricePerItem: pricePerItem,
        showMessage: false
      };
    }
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    const productId = product._id;
    const currentQty = selectedProducts[productId] || 0;
    
    if (currentQty === 0) {
      // Select product with quantity 1
      setSelectedProducts(prev => ({
        ...prev,
        [productId]: 1
      }));
    }
  };

  // Handle quantity change
  const handleQuantityChange = (productId, change) => {
    setSelectedProducts(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [productId]: newQty
      };
    });
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (totalSelectedQty < requiredQty) {
      notifyError(`${tr('Please select','الرجاء اختيار')} ${requiredQty - totalSelectedQty} ${tr('more items to complete the combo','عناصر إضافية لإكمال الصفقة')}`);
      return;
    }

    const pricing = calculatePricing();
    
    // Create detailed combo item for cart with enhanced tracking
    const productBreakdown = Object.entries(selectedProducts).map(([productId, qty]) => {
      const product = availableProducts.find(p => p._id === productId);
      return {
        productId: productId,
        productTitle: showingTranslateValue(product?.title) || 'Unknown Product',
        quantity: qty,
        unitPrice: pricing.pricePerItem,
        image: product?.image?.[0] || '',
        unitName: product?.unit?.unit?.shortCode || product?.unit?.unit?.name || 'pcs',
        originalPrice: product?.price || 0
      };
    });

    const comboItem = {
      id: `combo-${promotion._id}-${Date.now()}`, // Unique ID for each combo instance
      title: promotionName,
      price: pricing.pricePerItem,
      quantity: totalSelectedQty,
      
      // Enhanced combo tracking
      isCombo: true,
      promotion: promotion,
      selectedProducts: selectedProducts,
      comboPrice: pricing.totalPrice,
              image: availableProducts[0]?.image?.[0] || '',
      
      // Detailed breakdown for orders and invoices
      comboDetails: {
        promotionId: promotion._id,
        promotionName: promotionName,
        requiredItemCount: requiredQty,
        totalValue: pricing.totalPrice,
        pricePerItem: pricing.pricePerItem,
        totalSelectedQty: totalSelectedQty,
        productBreakdown: productBreakdown,
        promotionType: promotion.type || 'assorted_items',
        originalPromotionValue: promotion.value
      }
    };

    handleAddItem(comboItem, totalSelectedQty);
    
    console.log('Combo item added to cart:', comboItem);
  };

  // Navigate carousel manually with custom loop behavior
  const navigateCarousel = (direction) => {
    if (availableProducts.length <= 1) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentImageIndex((prev) => {
          // If we've reached the last image, reset to the first
          if (prev >= availableProducts.length - 1) {
            return 0; // Reset to first image
          }
          return prev + 1;
        });
      } else {
        setCurrentImageIndex((prev) => {
          // If we're at the first image, go to the last
          if (prev <= 0) {
            return availableProducts.length - 1; // Go to last image
          }
          return prev - 1;
        });
      }
      setIsAnimating(false);
    }, 150);
  };

  const pricing = calculatePricing();

  // Helper to render price with correct currency placement based on language
  const formatPrice = (value) => {
    const amount = getNumberTwo(value);

    if (lang === 'ar') {
      return (
        <>
          {amount}
          <span className="font-saudi_riyal ml-0.5">{currency}</span>
        </>
      );
    }

    return (
      <>
        <span className="font-saudi_riyal mr-0.5">{currency}</span>
        {amount}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header with promotion info */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <IoFlashOutline className="text-yellow-300 text-xl mr-2" />
            <h3 className="font-bold text-lg">{promotionName}</h3>
          </div>
          <div className="flex items-center text-sm">
            <IoTimeOutline className="mr-1" />
            <span>{timeRemaining}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-90">
            {tr('Select','اختر')} {requiredQty} {tr('items for','عناصر مقابل')} {formatPrice(promotion.value)}
          </div>
          <div className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold">
            {tr('SAVE','وفر')} {formatPrice(promotion.originalValue - promotion.value)}
          </div>
        </div>
      </div>

      {/* Product Carousel */}
      {availableProducts.length > 0 && (
        <div className="relative p-4">
          <div className="relative overflow-hidden rounded-lg bg-gray-50">
            {/* Main Image */}
            <div className="relative h-48 w-full">
              <Image
                src={availableProducts[currentImageIndex]?.image?.[0] || ''}
                alt={showingTranslateValue(availableProducts[currentImageIndex]?.title) || 'Product'}
                fill
                className={`object-cover transition-all duration-300 ${isAnimating ? 'scale-110' : 'scale-100'}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Image counter */}
              {availableProducts.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {availableProducts.length}
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {availableProducts.length > 1 && (
              <>
                <button
                  onClick={() => navigateCarousel('prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200"
                >
                  <FaChevronLeft className="text-gray-700" />
                </button>
                <button
                  onClick={() => navigateCarousel('next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200"
                >
                  <FaChevronRight className="text-gray-700" />
                </button>
              </>
            )}
          </div>

          {/* Product selection grid */}
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 mb-3">{tr('Select Products','اختر المنتجات')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableProducts.map((product, index) => {
                const productId = product._id;
                const selectedQty = selectedProducts[productId] || 0;
                const isSelected = selectedQty > 0;
                
                return (
                  <div
                    key={productId}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    {/* Product image */}
                    <div className="relative h-16 w-full mb-2">
                      <Image
                        src={product.image?.[0] || ''}
                        alt={showingTranslateValue(product.title) || 'Product'}
                        fill
                        className="object-cover rounded"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      />
                    </div>
                    
                    {/* Product title */}
                    <h5 className="text-xs font-medium text-gray-800 mb-1 line-clamp-2">
                      {showingTranslateValue(product.title)}
                    </h5>
                    
                    {/* Original price */}
                    <div className="text-xs text-gray-500 line-through">
                      {formatPrice(product.price)}
                    </div>
                    
                    {/* Quantity selector */}
                    {isSelected && (
                      <div className="flex items-center justify-center mt-2 space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(productId, -1);
                          }}
                          className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-purple-700 transition-colors"
                        >
                          <IoRemove size={12} />
                        </button>
                        <span className="text-sm font-bold text-purple-600 min-w-[20px] text-center">
                          {selectedQty}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(productId, 1);
                          }}
                          className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-purple-700 transition-colors"
                        >
                          <IoAdd size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {tr('Selected','المختار')}: {totalSelectedQty} / {requiredQty}
          </span>
          <span className="text-sm text-gray-600">
            {remainingQty > 0 ? `${remainingQty} ${tr('more needed','مطلوب المزيد')}` : tr('Ready!','جاهز!')}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((totalSelectedQty / requiredQty) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Pricing and action */}
      <div className="px-4 pb-4">
        {pricing.showMessage ? (
          <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{pricing.message}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Price breakdown */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">{tr('Combo Price','سعر الكومبو')}:</span>
                <span className="font-bold text-lg text-purple-600">
                  {formatPrice(pricing.totalPrice)}
                </span>
              </div>
              
              {pricing.isComboPrice ? (
                <div className="text-xs text-green-600 text-center">
                  {tr('Perfect combo!','كومبو مثالي!')} {formatPrice(pricing.pricePerItem)} {tr('per item','لكل عنصر')}
                </div>
              ) : pricing.extraItems > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  {tr('Combo','كومبو')}: {formatPrice(pricing.comboPrice)} + {tr('Extra','إضافي')}: {formatPrice(pricing.extraPrice)}
                </div>
              )}
            </div>
            
            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={totalSelectedQty < requiredQty}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                totalSelectedQty >= requiredQty
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transform hover:scale-105'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <IoBagAddSharp size={20} />
              <span>
                {totalSelectedQty >= requiredQty 
                  ? `${tr('Add Combo to Cart','أضف الكومبو إلى السلة')} - ${formatPrice(pricing.totalPrice)}`
                  : `${tr('Select','اختر')} ${remainingQty} ${tr('more items','عناصر إضافية')}`
                }
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboOfferCard; 