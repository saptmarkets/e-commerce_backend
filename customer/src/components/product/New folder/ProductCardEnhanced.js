import React, { useState } from "react";
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
import useMultiUnits from "@hooks/useMultiUnits";
import { notifyError, notifySuccess } from "@utils/toast";
import PromotionServices from "@services/PromotionServices";

const ProductCardEnhanced = ({ product, attributes, className = "" }) => {
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [promotionalUnits, setPromotionalUnits] = useState(new Set()); // Store IDs of promotional units

  const { items, addItem, updateItemQuantity } = useCart();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  // Use the multi-units hook
  const {
    selectedUnit,
    availableUnits,
    isLoadingUnits,
    availableStock,
    unitPricePerBase,
    currentUnitDisplayName,
    hasMultipleUnits,
    unitComparisonData,
    isValidUnit,
    handleUnitSelection,
    getUnitDisplayName,
    getTotalBaseUnits,
    isQuantityAvailable,
    getPricingBreakdown
  } = useMultiUnits(product);

  // Scan all units for promotions and store promotional unit IDs
  const scanAllUnitsForPromotions = async () => {
    if (!availableUnits?.length) return;
    
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
      
      console.log('ProductCardEnhanced: Promotional units found:', {
        promotionalUnitIds: Array.from(promotionalUnitIds),
        availableUnits: availableUnits.map(u => ({ id: u._id, name: getUnitDisplayName(u) }))
      });
      
    } catch (error) {
      console.error('Error scanning units for promotions:', error);
    }
  };

  // Scan for promotional units when units are loaded
  React.useEffect(() => {
    if (availableUnits?.length > 0) {
      scanAllUnitsForPromotions();
    }
  }, [availableUnits]);

  // Debug logging
  console.log('🔥🔥🔥 ProductCardEnhanced V2 RENDERING 🔥🔥🔥:', {
    productId: product?._id,
    productTitle: product?.title?.en || product?.title,
    hasMultiUnits: product?.hasMultiUnits,
    availableUnits: availableUnits,
    availableUnitsLength: availableUnits?.length,
    selectedUnit: selectedUnit,
    hasMultipleUnits: hasMultipleUnits,
    isLoadingUnits: isLoadingUnits,
    unitComparisonData: unitComparisonData
  });

  // Calculate current cart item with selected unit
  const currentCartItem = items.find((item) => 
    item.productId === product._id && 
    item.selectedUnitId === selectedUnit?._id
  );

  // Handle modal open
  const handleModalOpen = () => {
    setModalOpen(true);
  };

  // Handle unit selection and close dropdown
  const handleUnitSelect = (unit) => {
    handleUnitSelection(unit);
    setQuantity(1); // Reset quantity when changing units
    setUnitDropdownOpen(false);
  };

  // Handle adding to cart with selected unit
  const handleAddToCart = () => {
    if (!product || !selectedUnit) {
      return notifyError("Please select a unit!");
    }

    if (!isValidUnit) {
      return notifyError("Selected unit is not available!");
    }

    if (availableStock < 1) {
      return notifyError("Out of stock!");
    }
    
    if (!isQuantityAvailable(quantity)) {
      return notifyError(`Only ${availableStock} units available!`);
    }

    const pricingBreakdown = getPricingBreakdown(quantity);
    
    const cartItem = {
      id: `${product._id}-${selectedUnit._id}`, // Unique ID for cart
      productId: product._id,
      selectedUnitId: selectedUnit._id,
      title: showingTranslateValue(product?.title),
      image: product.image?.[0] || '',
      price: selectedUnit.price || 0,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      // Unit-specific information
      unitName: currentUnitDisplayName,
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      unitPrice: selectedUnit.price || 0,
      baseProductPrice: product.price || 0,
      pricePerBaseUnit: unitPricePerBase,
      totalBaseUnits: getTotalBaseUnits(quantity),
      // Additional metadata
      unitType: selectedUnit.unitType || 'multi',
      isMultiUnit: product?.hasMultiUnits || false
    };
    
    if (currentCartItem) {
      updateItemQuantity(currentCartItem.id, currentCartItem.quantity + quantity);
    } else {
      addItem(cartItem, quantity);
    }
    
    notifySuccess(`Added ${quantity} ${currentUnitDisplayName.toLowerCase()}(s) to cart!`);
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity) => {
    if (isQuantityAvailable(newQuantity)) {
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

  const rating = product?.rating || 4.2;
  const reviewCount = product?.reviewCount || Math.floor(Math.random() * 100) + 10;

  // Show loading state
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
        {/* Header with badges and favorite */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            {/* Test badge to verify component is being used */}
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
              MULTI-UNIT-V2-{new Date().getTime()}
            </span>
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
            aria-label="Add to favorites"
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
              src={imageError ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==' : getProductImage()}
              alt={getProductTitle()}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-lg"
              onError={() => {
                if (!imageError) {
                  setImageError(true);
                }
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

        {/* Unit Selection Dropdown - Only show if multiple units available */}
        {hasMultipleUnits && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <div className="relative">
              <button
                onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={unitDropdownOpen}
              >
                <span className="font-medium">
                  {selectedUnit ? currentUnitDisplayName : 'Select Unit'}
                </span>
                <IoChevronDown className={`w-5 h-5 transition-transform ${unitDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {unitDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {unitComparisonData.map((unit) => {
                    const isSelected = selectedUnit?._id === unit._id;
                    const hasPromotion = promotionalUnits.has(unit._id);
                    
                    return (
                      <button
                        key={unit._id}
                        onClick={() => handleUnitSelect(unit)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors relative ${
                          hasPromotion
                            ? 'bg-red-50 text-red-700 border-l-4 border-red-500' // Always red for promotional units
                            : isSelected
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-900'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{unit.displayName}</span>
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
                            ${getNumberTwo(unit.pricePerBase || 0)}/unit
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

        {/* Selected Unit Information - Show for multi-unit products */}
        {selectedUnit && product?.hasMultiUnits && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Selected Unit:</span>
              <span className="font-semibold text-gray-900">
                {currentUnitDisplayName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Pack Quantity:</span>
              <span>{selectedUnit.packQty} base units</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Price per base unit:</span>
              <span>${getNumberTwo(unitPricePerBase)}</span>
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-3">
            <span className="text-2xl font-bold text-gray-900">
              ${selectedUnit ? getNumberTwo(selectedUnit.price) : getNumberTwo(product?.price || 0)}
            </span>
            {selectedUnit && selectedUnit.price !== product?.price && (
              <span className="text-lg text-gray-500 line-through">
                ${getNumberTwo(product?.price || 0)}
              </span>
            )}
          </div>
          {selectedUnit && product?.hasMultiUnits && (
            <div className="text-sm text-gray-600 mt-1">
              ${getNumberTwo(unitPricePerBase)} per base unit
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          {availableStock > 0 ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">
                In Stock ({availableStock} {currentUnitDisplayName.toLowerCase()} available)
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
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <IoRemove className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= availableStock}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <IoAdd className="w-4 h-4" />
            </button>
          </div>
          {selectedUnit && selectedUnit.packQty > 1 && (
            <div className="text-xs text-gray-500 mt-1">
              Total base units: {getTotalBaseUnits(quantity)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={!isValidUnit || availableStock < 1}
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

export default ProductCardEnhanced; 