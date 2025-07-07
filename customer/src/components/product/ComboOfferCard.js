import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoAdd, IoRemove, IoTimeOutline, IoFlashOutline, IoBagAddSharp } from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from 'react-use-cart';
import useTranslation from 'next-translate/useTranslation';

// Internal imports
import useUtilsFunction from '@hooks/useUtilsFunction';
import { notifySuccess, notifyError } from '@utils/toast';

const ComboOfferCard = ({ promotion }) => {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { addItem } = useCart();
  const { t } = useTranslation('common');
  const { showingTranslateValue, getNumberTwo, currency, tr } = useUtilsFunction();

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

  // Auto-rotate carousel
  useEffect(() => {
    if (!promotion?.products || promotion.products.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % promotion.products.length);
        setIsAnimating(false);
      }, 150);
    }, 3000);

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
        image: product?.image?.[0] || '/images/placeholder.png',
        unitName: product?.unit?.unit?.shortCode || product?.unit?.unit?.name || 'pcs',
        originalPrice: product?.price || 0
      };
    });

    const comboItem = {
      id: `combo-${promotion._id}-${Date.now()}`, // Unique ID for each combo instance
      title: promotion.name || tr('Mega Combo Deal','صفقة مجمعة كبيرة'),
      price: pricing.pricePerItem,
      quantity: totalSelectedQty,
      
      // Enhanced combo tracking
      isCombo: true,
      promotion: promotion,
      selectedProducts: selectedProducts,
      comboPrice: pricing.totalPrice,
      image: availableProducts[0]?.image?.[0] || '/images/placeholder.png',
      
      // Detailed breakdown for orders and invoices
      comboDetails: {
        promotionId: promotion._id,
        promotionName: promotion.name || tr('Mega Combo Deal','صفقة مجمعة كبيرة'),
        requiredItemCount: requiredQty,
        totalValue: pricing.totalPrice,
        pricePerItem: pricing.pricePerItem,
        totalSelectedQty: totalSelectedQty,
        productBreakdown: productBreakdown,
        promotionType: promotion.type || 'assorted_items',
        originalPromotionValue: promotion.value
      }
    };

    addItem(comboItem, totalSelectedQty);
    notifySuccess(`${tr('Added','تمت إضافة')} ${totalSelectedQty} ${tr('item combo deal to cart!','صفقة مجمعة إلى السلة!')}`);
    
    console.log('Combo item added to cart:', comboItem);
  };

  // Navigate carousel manually
  const navigateCarousel = (direction) => {
    if (availableProducts.length <= 1) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next') {
        setCurrentImageIndex((prev) => (prev + 1) % availableProducts.length);
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + availableProducts.length) % availableProducts.length);
      }
      setIsAnimating(false);
    }, 150);
  };

  const pricing = calculatePricing();

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 sm:p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IoFlashOutline className="text-yellow-300 mr-1.5 text-sm" />
            <span className="font-bold text-sm sm:text-base">{tr('COMBO DEAL','عرض باقة')}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm">
            <IoTimeOutline className="mr-1" />
            <span>{timeRemaining}</span>
          </div>
        </div>
        
        <div className="mt-1.5">
          <h3 className="text-base sm:text-lg font-bold">{promotion.name}</h3>
          <p className="text-purple-100 text-xs sm:text-sm">
            {tr('Get any','احصل على')} {requiredQty} {tr('items for','عناصر مقابل')} <span className="font-saudi_riyal">{currency}</span>{getNumberTwo(promotion.value)}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Product Selector */}
        <div className="lg:w-1/2 p-3 sm:p-3.5 border-r border-gray-100">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{t('choose')} {requiredQty} {t('items')}:</h4>
          
          <div className="space-y-1.5 max-h-42 sm:max-h-50 overflow-y-auto custom-scrollbar">
            {availableProducts.map((product) => {
              const productId = product._id;
              const selectedQty = selectedProducts[productId] || 0;
              const isSelected = selectedQty > 0;
              
              return (
                <div
                  key={productId}
                  className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-xs sm:text-sm text-gray-800 line-clamp-2 break-words" title={showingTranslateValue(product.title)}>
                      {showingTranslateValue(product.title)}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Unit: {product.unit?.unit?.shortCode || product.unit?.unit?.name || 'pcs'}
                    </p>
                  </div>
                  
                  {isSelected ? (
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(productId, -1);
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <IoRemove size={12} />
                      </button>
                      <span className="font-bold text-purple-700 min-w-[20px] text-center">
                        {selectedQty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(productId, 1);
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <IoAdd size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full ml-3"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Circular Product Carousel */}
        <div className="lg:w-1/2 p-3 sm:p-3.5">
          <div className="relative">
            {/* Circular Carousel Container */}
            <div className="relative h-48 sm:h-56 lg:h-56 flex items-center justify-center">
              {availableProducts.length > 0 && (
                <div className="relative w-28 h-28 mx-auto">
                  {availableProducts.map((product, index) => {
                    const isCenter = index === currentImageIndex;
                    const offset = index - currentImageIndex;
                    
                    // Calculate position for circular arrangement
                    let translateX = 0;
                    let translateY = 0;
                    let scale = 0.7;
                    let zIndex = 1;
                    let opacity = 0.6;
                    
                    if (offset === 0) {
                      // Center image
                      scale = 1;
                      zIndex = 10;
                      opacity = 1;
                    } else if (offset === 1 || (offset < 0 && Math.abs(offset) === availableProducts.length - 1)) {
                      // Right side
                      translateX = 60;
                      translateY = 20;
                      zIndex = 5;
                    } else if (offset === -1 || (offset > 0 && offset === availableProducts.length - 1)) {
                      // Left side
                      translateX = -60;
                      translateY = 20;
                      zIndex = 5;
                    } else if (offset === 2 || (offset < 0 && Math.abs(offset) === availableProducts.length - 2)) {
                      // Far right
                      translateX = 90;
                      translateY = 40;
                      scale = 0.5;
                      opacity = 0.3;
                    } else if (offset === -2 || (offset > 0 && offset === availableProducts.length - 2)) {
                      // Far left
                      translateX = -90;
                      translateY = 40;
                      scale = 0.5;
                      opacity = 0.3;
                    } else {
                      // Hidden items
                      opacity = 0;
                      scale = 0.3;
                    }
                    
                    return (
                      <div
                        key={product._id}
                        className={`absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer`}
                        style={{
                          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                          zIndex: zIndex,
                          opacity: opacity,
                        }}
                        onClick={() => {
                          if (!isCenter) {
                            setCurrentImageIndex(index);
                          }
                        }}
                      >
                        <div className="relative w-22 h-22 sm:w-26 sm:h-26 lg:w-28 lg:h-28 mx-auto bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-colors">
                          <Image
                            src={product.image?.[0] || '/images/placeholder.png'}
                            alt={showingTranslateValue(product.title)}
                            fill
                            className="object-cover"
                          />
                          
                          {/* Overlay for non-center items */}
                          {!isCenter && (
                            <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                          )}
                          
                          {/* Center item indicator */}
                          {isCenter && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Navigation Arrows */}
              {availableProducts.length > 1 && (
                <>
                  <button
                    onClick={() => navigateCarousel('prev')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20 border border-purple-200"
                  >
                    <FaChevronLeft className="text-purple-600" size={14} />
                  </button>
                  <button
                    onClick={() => navigateCarousel('next')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20 border border-purple-200"
                  >
                    <FaChevronRight className="text-purple-600" size={14} />
                  </button>
                </>
              )}
            </div>
            
            {/* Product Info with Animation */}
            {availableProducts[currentImageIndex] && (
              <div className="mt-4 text-center px-2 transition-all duration-300">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                  <h5 className="font-semibold text-gray-800 text-sm line-clamp-2 break-words mb-1" title={showingTranslateValue(availableProducts[currentImageIndex].title)}>
                    {showingTranslateValue(availableProducts[currentImageIndex].title)}
                  </h5>
                  <p className="text-sm text-purple-600 font-medium">
                    {tr('Unit', 'الوحدة')}: {availableProducts[currentImageIndex].unit?.unit?.shortCode || 
                           availableProducts[currentImageIndex].unit?.unit?.name || 'pcs'}
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mt-2 flex justify-center space-x-1">
                    {availableProducts.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'bg-purple-500 w-4' 
                            : 'bg-purple-200 hover:bg-purple-300'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Pricing and Actions */}
      <div className="p-3 sm:p-3.5 bg-gray-50 border-t border-gray-100">
        {/* Selection Status */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600">
              {tr('selected', 'المحدد')}: {totalSelectedQty} {tr('items', 'العناصر')}
            </span>
            {remainingQty > 0 && (
              <span className="text-purple-600 font-medium">
                {tr('choose', 'اختر')} {remainingQty} {tr('more', 'المزيد')}
              </span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalSelectedQty / requiredQty) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="mb-3">
          {totalSelectedQty === 0 ? (
            <div className="text-center text-gray-500">
              <p className="text-base sm:text-lg font-bold"><span className="font-saudi_riyal">{currency}</span>{getNumberTwo(promotion.value)}</p>
              <p className="text-xs sm:text-sm">{tr('forAny', 'لأي')} {requiredQty} {tr('items', 'العناصر')}</p>
            </div>
          ) : pricing.showMessage ? (
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium text-purple-600">
                {pricing.message}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {tr('selected', 'المحدد')}: {totalSelectedQty} {tr('items', 'العناصر')}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-green-600">
                <span className="font-saudi_riyal">{currency}</span>{getNumberTwo(pricing.totalPrice)}
              </p>
              {pricing.isComboPrice ? (
                <p className="text-xs sm:text-sm text-green-600">
                  {tr('comboPrice', 'سعر الباقة')} {totalSelectedQty} {tr('items', 'العناصر')}
                </p>
              ) : (
                <div className="text-xs sm:text-sm text-gray-600">
                  <p>{tr('combo', 'الباقة')}: <span className="font-saudi_riyal">{currency}</span>{getNumberTwo(pricing.comboPrice)}</p>
                  <p>{tr('extra', 'إضافي')} {pricing.extraItems} {tr('items', 'العناصر')}: <span className="font-saudi_riyal">{currency}</span>{getNumberTwo(pricing.extraPrice)}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    (<span className="font-saudi_riyal">{currency}</span>{getNumberTwo(pricing.pricePerItem)} {tr('perExtraItem', 'لكل عنصر إضافي')})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={totalSelectedQty < requiredQty}
          className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium flex items-center justify-center transition-all text-sm ${
            totalSelectedQty < requiredQty
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg'
          }`}
        >
          <IoBagAddSharp className="mr-1.5 text-sm" />
          <span className="hidden sm:inline">
          {totalSelectedQty === 0 
            ? tr('selectItemsToAdd', 'حدد العناصر للإضافة')
            : totalSelectedQty < requiredQty
            ? `${tr('choose', 'اختر')} ${requiredQty - totalSelectedQty} ${tr('more', 'المزيد')} ${tr('items', 'العناصر')}`
            : `${tr('addItems', 'إضافة العناصر')} ${tr('toCart', 'للسلة')}`
          }
          </span>
          <span className="sm:hidden">
            {totalSelectedQty === 0 
              ? tr('selectItems', 'حدد العناصر')
              : totalSelectedQty < requiredQty
              ? `${tr('choose', 'اختر')} ${requiredQty - totalSelectedQty} ${tr('more', 'المزيد')}`
              : `${tr('addItems', 'إضافة العناصر')}`
            }
          </span>
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-wrap: break-word;
          hyphens: auto;
        }
        .break-words {
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
      `}</style>
    </div>
  );
};

export default ComboOfferCard; 