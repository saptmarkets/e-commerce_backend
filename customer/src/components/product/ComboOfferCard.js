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

    // Check stock availability for all selected products
    const stockCheck = Object.entries(selectedProducts).every(([productId, qty]) => {
      const product = availableProducts.find(p => p._id === productId);
      if (!product) return false;
      
      // Check if requested quantity is available in stock
      return qty <= (product.stock || 0);
    });

    if (!stockCheck) {
      notifyError(tr('Insufficient stock for some selected items!', 'الكمية المطلوبة غير متوفرة لبعض العناصر المحددة!'));
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
        originalPrice: product?.price || 0,
        stock: product?.stock || 0
      };
    });

    const comboItem = {
      id: `combo-${promotion._id}-${Date.now()}`, // Unique ID for each combo instance
      title: promotion.name || tr('Mega Combo Deal','صفقة مجمعة كبيرة'),
      price: pricing.pricePerItem,
      quantity: totalSelectedQty,
      stock: Math.min(...Object.values(selectedProducts).map(qty => qty)), // Use minimum stock as combo stock
      
      // Enhanced combo tracking
      isCombo: true,
      promotion: promotion,
      selectedProducts: selectedProducts,
      comboPrice: pricing.totalPrice,
              image: availableProducts[0]?.image?.[0] || '',
      
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
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-purple-100 hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IoFlashOutline className="text-yellow-300 mr-1.5 text-sm" />
            <span className="font-bold text-sm">{tr('COMBO DEAL','عرض باقة')}</span>
          </div>
          <div className="flex items-center text-xs">
            <IoTimeOutline className="mr-1" />
            <span>{timeRemaining}</span>
          </div>
        </div>
        
        <div className="mt-1.5">
          <h3 className="text-base font-bold line-clamp-1">{promotion.name}</h3>
          <p className="text-purple-100 text-xs">
            {tr('Get any','احصل على')} {requiredQty} {tr('items for','عناصر مقابل')} {formatPrice(promotion.value)}
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Left Side - Product Selector */}
        <div className="w-full p-1.5 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-1.5 text-sm">{tr('choose', 'اختر')} {requiredQty} {tr('items', 'العناصر')}:</h4>
          
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {availableProducts.map((product) => {
              const productId = product._id;
              const selectedQty = selectedProducts[productId] || 0;
              const isSelected = selectedQty > 0;
              
              return (
                <div
                  key={productId}
                  className={`flex items-center justify-between p-1 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-xs text-gray-800 line-clamp-2 break-words" title={showingTranslateValue(product.title)}>
                      {showingTranslateValue(product.title)}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tr('Unit', 'الوحدة')}: {lang === 'ar' 
                        ? (product.unit?.unit?.nameAr || product.unit?.unit?.name || tr('pcs', 'قطع'))
                        : (product.unit?.unit?.shortCode || product.unit?.unit?.name || tr('pcs', 'قطع'))
                      }
                    </p>
                  </div>
                  
                  {isSelected ? (
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(productId, -1);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <IoRemove size={8} />
                      </button>
                      <span className="font-bold text-purple-700 min-w-[16px] text-center text-sm">
                        {selectedQty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(productId, 1);
                        }}
                        className="w-5 h-5 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        <IoAdd size={8} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full ml-3"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Enhanced 3-Container Circular Product Carousel */}
        <div className="w-full p-1.5">
          <div className="relative">
            {/* Enhanced Circular Carousel Container */}
            <div className="relative h-40 flex items-center justify-center overflow-hidden">
              {availableProducts.length > 0 && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Three Image Containers - Left, Center, Right */}
                  
                  {/* Left Container - Previous Image */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-5">
                    <div 
                      className="w-20 h-20 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-200 cursor-pointer transition-all duration-700 hover:scale-105 hover:shadow-xl opacity-75 hover:opacity-95"
                        style={{
                        transform: 'perspective(300px) rotateY(20deg) translateZ(-15px)',
                      }}
                      onClick={() => navigateCarousel('prev')}
                    >
                      <Image
                        src={availableProducts[(currentImageIndex - 1 + availableProducts.length) % availableProducts.length]?.image?.[0] || '/images/placeholder.png'}
                        alt="Previous product"
                        fill
                        className="object-cover transition-transform duration-700"
                        sizes="80px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 to-transparent"></div>
                      
                      {/* Left indicator */}
                      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-purple-400 rounded-full border-2 border-white opacity-80"></div>
                    </div>
                  </div>

                  {/* Center Container - Main Current Image */}
                  <div className="relative z-10">
                    <div className="w-32 h-32 bg-white rounded-2xl shadow-2xl overflow-hidden border-3 border-purple-400 transition-all duration-700 hover:scale-105 relative">
                          <Image
                        src={availableProducts[currentImageIndex]?.image?.[0] || ''}
                        alt={showingTranslateValue(availableProducts[currentImageIndex]?.title)}
                        fill
                        className="object-cover transition-transform duration-700"
                        sizes="128px"
                      />
                      
                      {/* Animated Ring */}
                      <div className="absolute inset-0 rounded-2xl border-3 border-purple-500 animate-pulse"></div>
                      
                      {/* Center Indicator */}
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                        </div>
                      
                      {/* Featured Badge */}
                      <div className="absolute bottom-1.5 left-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
                        {currentImageIndex + 1}/{availableProducts.length}
                      </div>
                    </div>
                  </div>

                  {/* Right Container - Next Image */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-5">
                    <div 
                      className="w-20 h-20 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-200 cursor-pointer transition-all duration-700 hover:scale-105 hover:shadow-xl opacity-75 hover:opacity-95"
                      style={{
                        transform: 'perspective(300px) rotateY(-20deg) translateZ(-15px)',
                      }}
                      onClick={() => navigateCarousel('next')}
                    >
                      <Image
                        src={availableProducts[(currentImageIndex + 1) % availableProducts.length]?.image?.[0] || ''}
                        alt="Next product"
                        fill
                        className="object-cover transition-transform duration-700"
                        sizes="80px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-l from-purple-500/15 to-transparent"></div>
                      
                      {/* Right indicator */}
                      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-400 rounded-full border-2 border-white opacity-80"></div>
                    </div>
                  </div>

                  {/* Enhanced Floating Background Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Rotating Background Circles */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-purple-200/25 rounded-full animate-spin-slow"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-44 h-44 border border-purple-100/15 rounded-full animate-spin-reverse-slow"></div>
                    
                    {/* Floating Dots with better positioning */}
                    <div className="absolute top-4 left-8 w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-6 right-6 w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-300"></div>
                    <div className="absolute top-8 right-4 w-1 h-1 bg-purple-200 rounded-full animate-bounce delay-500"></div>
                    <div className="absolute bottom-8 left-4 w-1 h-1 bg-purple-300 rounded-full animate-bounce delay-700"></div>
                  </div>

                  {/* Slide Direction Indicators */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-15">
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                    <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse delay-400"></div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Navigation Arrows - REMOVED */}
              {/* Navigation arrows removed as requested */}
            </div>
            
            {/* Enhanced Product Info with Animation */}
            {availableProducts[currentImageIndex] && (
              <div className="mt-2 text-center px-2 transition-all duration-700 transform">
                <div className="flex items-center justify-between text-sm">
                  <h5 className={`font-bold text-gray-800 line-clamp-1 break-words flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`} title={showingTranslateValue(availableProducts[currentImageIndex].title)}>
                    {showingTranslateValue(availableProducts[currentImageIndex].title)}
                  </h5>
                  <p className="text-xs text-purple-700 font-bold bg-gradient-to-r from-purple-200 to-purple-300 px-2 py-1 rounded-full ml-2 whitespace-nowrap shadow-sm">
                    {tr('Unit', 'الوحدة')}: {lang === 'ar' 
                      ? (availableProducts[currentImageIndex].unit?.unit?.nameAr || availableProducts[currentImageIndex].unit?.unit?.name || tr('pcs', 'قطع'))
                      : (availableProducts[currentImageIndex].unit?.unit?.shortCode || availableProducts[currentImageIndex].unit?.unit?.name || tr('pcs', 'قطع'))
                    }
                  </p>
                </div>
                
                {/* Enhanced Progress indicator */}
                <div className="mt-2 flex justify-center space-x-1.5">
                  {availableProducts.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2.5 rounded-full transition-all duration-700 cursor-pointer transform hover:scale-110 ${
                        index === currentImageIndex 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 w-8 shadow-lg scale-110' 
                          : 'bg-purple-200 hover:bg-purple-300 w-2.5'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Pricing and Actions */}
      <div className="p-1.5 bg-gray-50 border-t border-gray-100">
        {/* Selection Status */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs">
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
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalSelectedQty / requiredQty) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="mb-1.5">
          {totalSelectedQty === 0 ? (
            <div className={`${lang === 'ar' ? 'text-right' : 'text-center'} text-gray-500 leading-tight`}>
              <p className="text-lg font-bold mb-0">{formatPrice(promotion.value)}</p>
              <p className="text-xs -mt-1">{tr('forAny', 'لأي')} {requiredQty} {tr('items', 'العناصر')}</p>
            </div>
          ) : pricing.showMessage ? (
            <div className={`${lang === 'ar' ? 'text-right' : 'text-center'} leading-tight`}>
              <p className="text-sm font-medium text-purple-600 mb-0">
                {pricing.message}
              </p>
              <p className="text-xs text-gray-600 -mt-1">
                {tr('selected', 'المحدد')}: {totalSelectedQty} {tr('items', 'العناصر')}
              </p>
            </div>
          ) : (
            <div className={`${lang === 'ar' ? 'text-right' : 'text-center'} leading-tight`}>
              <p className="text-xl font-bold text-green-600 mb-0">
                {formatPrice(pricing.totalPrice)}
              </p>
              {pricing.isComboPrice ? (
                <p className="text-xs text-green-600 -mt-1">
                  {tr('comboPrice', 'سعر الباقة')} {totalSelectedQty} {tr('items', 'العناصر')}
                </p>
              ) : (
                <div className="text-xs text-gray-600 leading-tight">
                  <p className="mb-0">{tr('combo', 'الباقة')}: {formatPrice(pricing.comboPrice)}</p>
                  <p className="mb-0">{tr('extra', 'إضافي')} {pricing.extraItems} {tr('items', 'العناصر')}: {formatPrice(pricing.extraPrice)}</p>
                  <p className="text-xs text-purple-600 -mt-1">
                    ({formatPrice(pricing.pricePerItem)} {tr('perExtraItem', 'لكل عنصر إضافي')})
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
          className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center transition-all text-sm ${
            totalSelectedQty < requiredQty
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg'
          }`}
        >
          <IoBagAddSharp className="mr-1.5 text-sm" />
          <span>
          {totalSelectedQty === 0 
            ? tr('selectItemsToAdd', 'حدد العناصر للإضافة')
            : totalSelectedQty < requiredQty
            ? `${tr('choose', 'اختر')} ${requiredQty - totalSelectedQty} ${tr('more', 'المزيد')} ${tr('items', 'العناصر')}`
            : `${tr('addItems', 'إضافة العناصر')} ${tr('toCart', 'للسلة')}`
          }
          </span>
        </button>
      </div>

      {/* Enhanced Custom Styles */}
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
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-wrap: break-word;
          hyphens: auto;
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
        
        /* Enhanced Animations */
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        @keyframes spin-reverse-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 15s linear infinite;
        }
        
        /* 3D Perspective Effects */
        .perspective-container {
          perspective: 1000px;
        }
        
        /* Hover Effects */
        .hover-lift:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
};

export default ComboOfferCard; 