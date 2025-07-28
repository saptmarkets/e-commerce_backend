import React, { useState } from "react";
import Image from "next/image";
import { 
  IoAdd, 
  IoRemove, 
  IoStarSharp,
  IoStarOutline,
  IoHeartOutline,
  IoHeart
} from "react-icons/io5";
import { useCart } from "react-use-cart";

// Internal imports
import useAddToCart from "@hooks/useAddToCart";
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@utils/toast";

const ProductCardSimple = ({ product, attributes, className = "" }) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { handleAddItem } = useAddToCart();
  const { items, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  // Get current cart item
  const currentCartItem = items.find((item) => item.id === product._id);

  // Handle opening modal
  const handleModalOpen = () => {
    setModalOpen(true);
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product || (product.stock || 0) < 1) {
      return notifyError("Out of stock!");
    }
    
    const cartItem = {
      id: product._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: product.price || 0,
      stock: product.stock || 0,
      category: product.category,
      sku: product.sku || '',
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantity);
    } else {
      handleAddItem(cartItem, quantity);
    }
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 999)) {
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

  // Get product images
  const getProductImage = () => {
    if (product?.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image[0];
    }
    return '/images/placeholder.svg';
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

  const getProductPrice = () => {
    try {
      return getNumberTwo(product?.price || 0);
    } catch (error) {
      console.warn('Error getting product price:', error);
      return '0.00';
    }
  };

  const rating = product?.rating || 4.2;
  const reviewCount = product?.reviewCount || Math.floor(Math.random() * 100) + 10;

  return (
    <>
      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          attributes={attributes}
        />
      )}

      <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-5 max-w-sm mx-auto ${className}`}>
        {/* Header with favorite */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {product?.discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                {product.discount}% OFF
              </span>
            )}
          </div>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isFavorite ? (
              <IoHeart className="w-4 h-4 text-red-500" />
            ) : (
              <IoHeartOutline className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Product Image */}
        <div className="mb-4">
          <div 
            className="relative h-52 sm:h-60 mb-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleModalOpen}
          >
            <Image
              src={getProductImage()}
              alt={getProductTitle()}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              onError={(e) => {
                if (!e.target.dataset.fallbackSet) {
                  e.target.dataset.fallbackSet = 'true';
                  e.target.src = '/images/placeholder.svg';
                }
              }}
              loading="lazy"
            />
          </div>
        </div>

        {/* Product Title and Rating */}
        <h3 
          className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-tight"
          onClick={handleModalOpen}
        >
          {getProductTitle()}
        </h3>
        
        <div className="flex items-center space-x-2 mb-3 text-xs">
          <div className="flex items-center space-x-0.5">
            {renderStars(rating)}
          </div>
          <span className="text-xs font-medium text-gray-900">{rating.toFixed(1)}</span>
          <span className="text-xs text-gray-500 hidden sm:inline">({reviewCount} reviews)</span>
        </div>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-baseline space-x-2 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              {getProductPrice()}
            </span>
            {product?.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ${getNumberTwo(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          {(product?.stock || 0) > 0 ? (
            <span className="text-sm font-medium text-green-600">
              In Stock ({product?.stock || 0} available)
            </span>
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
              disabled={quantity >= (product?.stock || 999)}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoAdd className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={!product || (product.stock || 0) < 1}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Cart
          </button>
        </div>

        {/* SKU */}
        {product?.sku && (
          <div className="mt-4 text-xs text-gray-500">
            SKU: {product.sku}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCardSimple; 