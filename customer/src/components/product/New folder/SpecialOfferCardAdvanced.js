import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoChevronDown, 
  IoStarSharp,
  IoFlashSharp,
  IoGiftSharp,
  IoPricetagSharp,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoArrowForward
} from "react-icons/io5";
import { useCart } from "react-use-cart";

// Internal imports
import useAddToCart from "@hooks/useAddToCart";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";

const SpecialOfferCardAdvanced = ({ 
  product, 
  promotion, 
  attributes, 
  className = "",
  variant = "default" // "default", "featured", "compact"
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [timeLeft, setTimeLeft] = useState(null);

  const { handleAddItem } = useAddToCart();
  const { items, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  // Calculate time left for promotion
  useEffect(() => {
    if (!promotion?.endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(promotion.endDate);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [promotion?.endDate]);

  // Get promotion type styling
  const getPromotionTypeInfo = () => {
    if (!promotion) return null;

    switch (promotion.type) {
      case 'fixed_price':
        return {
          icon: IoPricetagSharp,
          label: 'Special Price',
          color: 'bg-red-500',
          gradient: 'from-red-500 to-pink-600'
        };
      case 'bulk_purchase':
        return {
          icon: IoGiftSharp,
          label: 'Bulk Deal',
          color: 'bg-green-500',
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'assorted_items':
        return {
          icon: IoFlashSharp,
          label: 'Combo Deal',
          color: 'bg-purple-500',
          gradient: 'from-purple-500 to-indigo-600'
        };
      default:
        return {
          icon: IoFlashSharp,
          label: 'Special Offer',
          color: 'bg-orange-500',
          gradient: 'from-orange-500 to-red-600'
        };
    }
  };

  // Calculate pricing based on promotion
  const calculatePricing = () => {
    if (!product || !promotion) return null;

    const originalPrice = product.price || product.originalPrice || 0;
    let promotionPrice = originalPrice;
    let savings = 0;
    let savingsPercent = 0;
    let description = '';

    switch (promotion.type) {
      case 'fixed_price':
        promotionPrice = promotion.value;
        savings = originalPrice - promotionPrice;
        savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
        description = `Special price of $${getNumberTwo(promotionPrice)}`;
        break;
        
      case 'bulk_purchase':
        const requiredQty = promotion.requiredQty || 1;
        const freeQty = promotion.freeQty || 0;
        const totalItems = requiredQty + freeQty;
        const costForRequired = originalPrice * requiredQty;
        const normalCostForTotal = originalPrice * totalItems;
        savings = normalCostForTotal - costForRequired;
        savingsPercent = normalCostForTotal > 0 ? Math.round((savings / normalCostForTotal) * 100) : 0;
        description = `Buy ${requiredQty}, get ${freeQty} FREE!`;
        promotionPrice = costForRequired;
        break;
        
      case 'assorted_items':
        promotionPrice = promotion.value;
        const itemCount = promotion.requiredItemCount || 1;
        const normalCost = originalPrice * itemCount;
        savings = normalCost - promotionPrice;
        savingsPercent = normalCost > 0 ? Math.round((savings / normalCost) * 100) : 0;
        description = `${itemCount} items for $${getNumberTwo(promotionPrice)}`;
        break;
    }

    return {
      originalPrice,
      promotionPrice,
      savings,
      savingsPercent,
      description
    };
  };

  // Get product images
  const getProductImages = () => {
    if (product?.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image;
    }
          return [''];
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product || !promotion) return;
    
    const pricing = calculatePricing();
    if (!pricing) return;

    const cartItem = {
      id: product._id,
      promotionId: promotion._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: pricing.promotionPrice,
      originalPrice: pricing.originalPrice,
      promotion: promotion,
      category: product.category,
      sku: product.sku || '',
      promotionType: promotion.type,
      promotionDescription: pricing.description
    };

    // Check for minimum quantity requirements
    let quantityToAdd = quantity;
    if (promotion.minQty && quantity < promotion.minQty) {
      quantityToAdd = promotion.minQty;
      notifySuccess(`Added minimum quantity of ${quantityToAdd} to cart!`);
    } else {
      notifySuccess(`Added ${quantityToAdd} items to cart!`);
    }

    handleAddItem(cartItem, quantityToAdd);
  };

  const typeInfo = getPromotionTypeInfo();
  const pricing = calculatePricing();
  const images = getProductImages();

  if (!product || !promotion || !pricing) {
    return null;
  }

  // Render different variants
  if (variant === "compact") {
    return (
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}>
        <div className="relative">
          <div className={`absolute top-0 left-0 ${typeInfo.color} text-white px-3 py-1 text-xs font-bold z-10`}>
            {pricing.savingsPercent}% OFF
          </div>
          <div className="h-40 relative">
            <Image
              src={images[0]}
              alt={showingTranslateValue(product?.title)}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2">
            {showingTranslateValue(product?.title)}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-gray-900">
                ${getNumberTwo(pricing.promotionPrice)}
              </span>
              <span className="text-sm text-gray-500 line-through ml-2">
                ${getNumberTwo(pricing.originalPrice)}
              </span>
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className={`w-full ${typeInfo.color} text-white py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}>
      {/* Promotion Header */}
      <div className={`bg-gradient-to-r ${typeInfo.gradient} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <typeInfo.icon className="w-6 h-6" />
            <span className="font-bold text-lg">{typeInfo.label}</span>
          </div>
          {timeLeft && !timeLeft.expired && (
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <IoTimeOutline className="w-4 h-4" />
              <span className="text-sm font-medium">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {timeLeft.hours}h {timeLeft.minutes}m left
              </span>
            </div>
          )}
        </div>
        <p className="text-sm opacity-90 mt-1">{pricing.description}</p>
      </div>

      <div className="p-6">
        {/* Product Image Gallery */}
        <div className="mb-6">
          <div className="relative h-64 mb-3 rounded-lg overflow-hidden">
            <Image
              src={images[selectedImageIndex]}
              alt={showingTranslateValue(product?.title)}
              fill
              className="object-cover"
            />
            {pricing.savingsPercent > 0 && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                Save {pricing.savingsPercent}%
              </div>
            )}
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

        {/* Product Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {showingTranslateValue(product?.title)}
        </h3>

        {/* Pricing Display */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-3 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              ${getNumberTwo(pricing.promotionPrice)}
            </span>
            <span className="text-xl text-gray-500 line-through">
              ${getNumberTwo(pricing.originalPrice)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              You save ${getNumberTwo(pricing.savings)}
            </span>
            <span className="text-sm text-gray-600">
              ({pricing.savingsPercent}% off)
            </span>
          </div>
        </div>

        {/* Promotion Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <IoCheckmarkCircle className="w-5 h-5 text-green-500 mr-2" />
            Promotion Details
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            {promotion.type === 'bulk_purchase' && (
              <>
                <p>• Buy {promotion.requiredQty} items</p>
                <p>• Get {promotion.freeQty} items FREE</p>
                <p>• Total: {(promotion.requiredQty || 0) + (promotion.freeQty || 0)} items</p>
              </>
            )}
            {promotion.type === 'fixed_price' && (
              <p>• Special fixed price offer</p>
            )}
            {promotion.type === 'assorted_items' && (
              <p>• Mix and match {promotion.requiredItemCount} items</p>
            )}
            {promotion.minQty && (
              <p>• Minimum quantity: {promotion.minQty}</p>
            )}
            {promotion.maxQty && (
              <p>• Maximum quantity: {promotion.maxQty}</p>
            )}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <IoRemove className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold min-w-[4rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <IoAdd className="w-5 h-5" />
            </button>
          </div>
          {promotion.minQty && quantity < promotion.minQty && (
            <p className="text-sm text-orange-600 mt-1">
              Minimum quantity for this offer: {promotion.minQty}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            className={`w-full bg-gradient-to-r ${typeInfo.gradient} text-white py-4 px-6 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}
          >
            <span>Add to Cart</span>
            <IoArrowForward className="w-5 h-5" />
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              View Details
            </button>
            <button className="py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Share Deal
            </button>
          </div>
        </div>

        {/* Promotion Validity */}
        {promotion.endDate && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <IoTimeOutline className="w-4 h-4" />
              <span className="text-sm font-medium">
                {timeLeft && !timeLeft.expired ? (
                  <>
                    Offer ends in {timeLeft.days > 0 && `${timeLeft.days} days `}
                    {timeLeft.hours}h {timeLeft.minutes}m
                  </>
                ) : (
                  'Offer expired'
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialOfferCardAdvanced; 