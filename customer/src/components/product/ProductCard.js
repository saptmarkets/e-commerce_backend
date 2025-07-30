import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { IoAdd, IoBagAddSharp, IoRemove } from "react-icons/io5";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { useCart } from "react-use-cart";

//internal import
import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import useAddToCart from "@hooks/useAddToCart";
import ProductModal from "@components/modal/ProductModal";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { notifyError } from "@utils/toast";
import PromotionServices from "@services/PromotionServices";
import ProductUnitServices from '@services/ProductUnitServices';
import { getUnitDisplayName, getShortUnitName, getBilingualUnitDisplay } from "@utils/unitUtils";

const ProductCard = ({ product, attributes, promotion }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activePromotion, setActivePromotion] = useState(null);
  const { handleIncreaseQuantity, handleAddItem } = useAddToCart();
  const { items, addItem, updateItemQuantity, removeItem } = useCart();
  const { showingTranslateValue, getNumberTwo, tr, lang } = useUtilsFunction();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  // Check if the product is already in the cart
  const existingProduct = items.find((item) => item.id === product._id);

  // Load product promotion if available
  useEffect(() => {
    const loadPromotion = async () => {
      if (promotion) {
        setActivePromotion(promotion);
      } else if (product._id) {
        try {
          const promotions = await PromotionServices.getPromotionsForProduct(product._id);
          if (promotions && promotions.length > 0) {
            setActivePromotion(promotions[0]);
          }
        } catch (error) {
          console.error("Error loading promotion:", error);
        }
      }
    };
    
    loadPromotion();
  }, [product._id, promotion]);

  // Load product units if it's a multi-unit product
  useEffect(() => {
    const loadProductUnits = async () => {
      if (!product?.hasMultiUnits) {
        // Create default unit for single-unit products
        const defaultUnit = {
          _id: `default_${product._id}`,
          unit: { name: product.unit || 'pcs', shortCode: product.unit || 'pcs' },
          unitValue: 1,
          packQty: 1,
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          isDefault: true
        };
        setAvailableUnits([defaultUnit]);
        setSelectedUnit(defaultUnit);
        return;
      }

      try {
        setIsLoadingUnits(true);
        const response = await ProductUnitServices.getProductUnits(product._id);
        
        if (response && response.length > 0) {
          setAvailableUnits(response);
          // Select default unit or first unit
          const defaultUnit = response.find(unit => unit.isDefault) || response[0];
          setSelectedUnit(defaultUnit);
        } else {
          // Fallback for multi-unit products without units
          const fallbackUnit = {
            _id: `fallback_${product._id}`,
            unit: { name: product.unit || 'pcs', shortCode: product.unit || 'pcs' },
            unitValue: 1,
            packQty: 1,
            price: product.price || 0,
            originalPrice: product.originalPrice || product.price || 0,
            isDefault: true
          };
          setAvailableUnits([fallbackUnit]);
          setSelectedUnit(fallbackUnit);
        }
      } catch (error) {
        console.error("Error loading product units:", error);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    loadProductUnits();
  }, [product._id, product.hasMultiUnits]);

  // Calculate current cart item with selected unit
  const currentCartItem = React.useMemo(() => {
    if (!selectedUnit) return null;
    return items.find((item) => 
      item.productId === product._id && 
      item.selectedUnitId === selectedUnit._id
    );
  }, [items, product._id, selectedUnit]);

  // Calculate available stock for selected unit
  const availableStock = React.useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / (selectedUnit.packQty || 1));
  }, [selectedUnit, product?.stock]);

  // Handle adding item to cart
  const handleAddItemToCart = (p) => {
    if (p.stock < 1) return notifyError("Insufficient stock!");
    
    if (p?.variants?.length > 0) {
      setModalOpen(!modalOpen);
      return;
    }
    
    const { slug, variants, categories, description, ...updatedProduct } = product;
    
    // Handle promotional minimum quantity requirement
    let quantityToAdd = 1;
    if (activePromotion && activePromotion.minQty > 1) {
      quantityToAdd = activePromotion.minQty;
    }
    
    // Calculate the correct price based on promotion
    let itemPrice = p.prices?.price || p.price;
    
    if (activePromotion) {
      // For promotions with min quantity, use the promotion price
      itemPrice = activePromotion.offerPrice / activePromotion.minQty;
    }
    
    const newItem = {
      ...updatedProduct,
      title: showingTranslateValue(p?.title),
      id: p._id,
      variant: p.prices || { price: p.price },
      price: itemPrice,
      promotion: activePromotion,
      promotionPrice: activePromotion ? activePromotion.offerPrice : null,
      minQty: activePromotion ? activePromotion.minQty : 1,
      maxQty: activePromotion ? activePromotion.maxQty : null,
      basePrice: p.prices?.price || p.price, // Store original non-promotional price
    };
    
    // Use the handleAddItem from useAddToCart hook which handles minimum quantity logic
    handleAddItem(newItem, quantityToAdd);
  };

  // Handle buy now
  const handleBuyNow = (p) => {
    handleAddItemToCart(p);
    // You could add navigation to checkout here
  };

  // Calculate rating display
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    
    return stars;
  };

  // Get product tags/categories
  const getProductTags = () => {
    if (!product.categories || product.categories.length === 0) return null;
    
    const categoryNames = product.categories.map(c => 
      typeof c === 'string' ? c : (c.name || '')
    ).filter(Boolean);
    
    if (categoryNames.length === 0) return null;
    
    return (
      <div className="bg-gray-100 px-3 py-1 text-xs text-green-600 rounded">
        {`[${categoryNames.map(name => `"${name}"`).join(',')}]`}
      </div>
    );
  };

  // Calculate promotional information
  const getPromotionalInfo = () => {
    if (!activePromotion) return null;
    
    const regularPrice = product.prices?.price || product.price;
    const promotionalPrice = activePromotion.offerPrice / activePromotion.minQty;
    const savings = regularPrice - promotionalPrice;
    const savingsPercent = (savings / regularPrice) * 100;
    
    return {
      regularPrice,
      promotionalPrice,
      savings,
      savingsPercent,
      minQty: activePromotion.minQty,
      maxQty: activePromotion.maxQty,
      unit: activePromotion.unit
    };
  };
  
  const promotionInfo = getPromotionalInfo();

  // Handle unit selection
  const handleUnitSelection = (unit) => {
    setSelectedUnit(unit);
    setQuantity(1);
    setUnitDropdownOpen(false);
  };

  // Handle adding to cart
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
      price: (activePromotion && quantityToAdd >= (activePromotion.minQty || 1))
              ? (activePromotion.offerPrice || activePromotion.value || selectedUnit.price)
              : selectedUnit.price,
      basePrice: selectedUnit.price,
      stock: availableStock,
      category: product.category,
      sku: selectedUnit.sku || product.sku || '',
      // Multi-unit information
      unit: selectedUnit.unit,
      unitValue: selectedUnit.unitValue || 1,
      packQty: selectedUnit.packQty || 1,
      unitPrice: selectedUnit.price || 0,
      baseProductPrice: product.price || 0,
      // Promotional information
      promotion: activePromotion,
      isPromotional: Boolean(activePromotion),
      minQty: activePromotion?.minQty || 1,
      maxQty: activePromotion?.maxQty || null,
      // Additional metadata
      unitType: selectedUnit.unitType || 'multi',
      isMultiUnit: product?.hasMultiUnits || Boolean(selectedUnit.packQty > 1)
    };
    
    // Use the handleAddItem from useAddToCart hook which handles minimum quantity logic
    handleAddItem(cartItem, quantityToAdd);
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
    }
  };

  // Get localized unit display name
  const getLocalizedUnitDisplayName = (unit) => {
    return getUnitDisplayName(unit, lang);
  };

  // Get pack quantity display information
  const getPackQuantityDisplay = () => {
    if (!selectedUnit || selectedUnit.packQty <= 1) return null;
    
    return {
      packQty: selectedUnit.packQty,
      unitName: getLocalizedUnitDisplayName(selectedUnit),
      totalBaseUnits: quantity * selectedUnit.packQty,
      pricePerPiece: selectedUnit.price / selectedUnit.packQty
    };
  };

  const packInfo = getPackQuantityDisplay();

  return (
    <>
      {modalOpen && (
        <ProductModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          product={product}
          attributes={attributes}
          promotion={activePromotion}
        />
      )}

      <div className="relative bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md max-w-sm mx-auto card-responsive">
        {/* Promotion badge */}
        {promotionInfo && (
          <div className="absolute top-0 left-0 bg-red-600 text-white px-1.5 py-0.5 z-10 text-responsive-xs font-medium badge-responsive">
            {promotionInfo.savingsPercent > 0 ? 
              `SAVE ${promotionInfo.savingsPercent.toFixed(0)}%` : 
              'SPECIAL OFFER'}
          </div>
        )}
        
        {/* Product image */}
        <div 
          onClick={() => setModalOpen(!modalOpen)}
          className="relative cursor-pointer h-40 sm:h-52 md:h-60 overflow-hidden"
        >
          <Image
            src={product.image && product.image.length > 0 ? product.image[0] : '/images/placeholder.svg'}
            alt={showingTranslateValue(product?.title) || 'Product Image'}
            width={350}
            height={350}
            className="object-cover w-full h-full transition duration-200 transform hover:scale-105 image-responsive"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              if (!e.target.dataset.fallbackSet) {
                e.target.dataset.fallbackSet = 'true';
                e.target.src = '/images/placeholder.svg';
              }
            }}
          />
        </div>
        
        {/* Product info */}
        <div className="p-2 sm:p-3 md:p-3.5">
          {/* Tags */}
          <div className="mb-1">
          {getProductTags()}
          </div>
          
          {/* Title */}
          <h3 
            onClick={() => setModalOpen(!modalOpen)}
            className="text-responsive-sm font-medium text-gray-700 cursor-pointer hover:text-green-600 transition-colors my-1 sm:my-1.5 line-clamp-2 leading-tight"
          >
            {showingTranslateValue(product?.title)}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-1 sm:mb-1.5">
            <div className="flex space-x-0.5 text-responsive-xs">
              {renderRatingStars(product.rating || 4.5)}
            </div>
            <span className="text-responsive-xs text-gray-500 ml-1 mobile-hide">
              ({product.reviews?.length || Math.floor(Math.random() * 20) + 5})
            </span>
          </div>
          
          {/* Multi-Unit Selector */}
          {product?.hasMultiUnits && availableUnits.length > 1 && (
            <div className="mb-2 sm:mb-3">
              <div className="relative">
                <button
                  onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="w-full p-1.5 sm:p-2 border border-gray-200 rounded-lg text-left bg-gray-50 hover:bg-gray-100 transition-colors text-responsive-sm touch-target"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {getLocalizedUnitDisplayName(selectedUnit)}
                      </span>
                      {packInfo && (
                        <div className="text-responsive-xs text-blue-600 mt-0.5 sm:mt-1">
                          Pack of {packInfo.packQty} pieces
                        </div>
                      )}
                    </div>
                    <IoChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${unitDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                {unitDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-36 sm:max-h-48 overflow-y-auto">
                    {availableUnits.map((unit) => (
                      <button
                        key={unit._id}
                        onClick={() => handleUnitSelection(unit)}
                        className="w-full p-1.5 sm:p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-responsive-sm touch-target"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">
                              {getLocalizedUnitDisplayName(unit)}
                            </span>
                            {unit.packQty > 1 && (
                              <div className="text-responsive-xs text-blue-600">
                                Pack of {unit.packQty} pieces
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-600 price-responsive">
                              ${getNumberTwo(unit.price)}
                            </div>
                            {unit.packQty > 1 && (
                              <div className="text-responsive-xs text-gray-500">
                                ${getNumberTwo(unit.price / unit.packQty)}/{tr('pc','قطعة')}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pack Quantity Information */}
          {packInfo && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-800">
                <div className="flex justify-between items-center">
                  <span>{tr('Pack Size:','حجم الحزمة:')}</span>
                  <span className="font-semibold">{packInfo.packQty} pieces</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>{tr('Price per piece:','السعر لكل قطعة:')}</span>
                  <span className="font-semibold">${getNumberTwo(packInfo.pricePerPiece)}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-200">
                    <span>{tr('Total pieces:','إجمالي القطع:')}</span>
                    <span className="font-semibold">{packInfo.totalBaseUnits} {tr('pieces','قطع')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Price */}
          <div className="mb-2.5">
            {promotionInfo ? (
              <div>
                <div className="flex items-center flex-wrap">
                  <span className="text-sm sm:text-base font-bold text-red-600">
                    ${getNumberTwo(promotionInfo.promotionalPrice)}
                    <span className="text-xs font-normal ml-1">/ {promotionInfo.unit}</span>
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 line-through ml-2">
                    ${getNumberTwo(promotionInfo.regularPrice)}
                  </span>
                </div>
                <div className="text-xs text-red-600 font-medium mt-0.5">
                  Buy {promotionInfo.minQty} {promotionInfo.unit} for ${getNumberTwo(activePromotion.offerPrice)}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center">
                  <span className="text-sm sm:text-base font-bold text-green-600">
                    ${getNumberTwo(product.prices?.price || product.price)}
                  </span>
                </div>
                <div className="flex items-center mt-0.5">
                  <span className="text-xs text-gray-500">1 {getShortUnitName({ name: product.unit || 'pcs' }, lang)}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="mb-3">
            {availableStock > 0 ? (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-green-600 font-medium">
                  {availableStock} {selectedUnit ? getUnitDisplayName(selectedUnit, lang).toLowerCase() : tr('units','وحدة')} {tr('available','متاحة')}
                </span>
                {packInfo && (
                  <div className="group relative">
                    <IoInformationCircleOutline className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {product?.stock || 0} total pieces in stock
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-red-600 font-medium">{tr('Out of Stock','غير متوفر')}</span>
            )}
          </div>
          
          {/* Quantity Selector */}
          {availableStock > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{tr('Quantity','الكمية')}</span>
                {packInfo && (
                  <span className="text-xs text-gray-500">
                    = {packInfo.totalBaseUnits} pieces
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 mt-2">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoRemove className="w-4 h-4" />
                </button>
                <span className="text-lg font-medium min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= availableStock}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoAdd className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Add to cart */}
          <div className="flex items-center gap-1.5">
            {existingProduct ? (
              <div className="flex items-center mr-1">
                <button
                  onClick={() => {
                    // For promotional items with minQty, check if decreasing would go below minQty
                    if (existingProduct.promotion && existingProduct.minQty > 1 && existingProduct.quantity <= existingProduct.minQty) {
                      removeItem(existingProduct.id);
                    } else {
                      updateItemQuantity(existingProduct.id, existingProduct.quantity - 1);
                    }
                  }}
                  className="flex items-center justify-center h-7 w-7 bg-gray-100 text-gray-600 rounded-l text-sm"
                >
                  <IoRemove />
                </button>
                <span className="font-medium text-gray-700 w-7 text-center border-t border-b border-gray-200 text-xs h-7 flex items-center justify-center">
                  {existingProduct.quantity}
                </span>
                <button
                  onClick={() => handleIncreaseQuantity(existingProduct)}
                  className="flex items-center justify-center h-7 w-7 bg-gray-100 text-gray-600 rounded-r text-sm"
                >
                  <IoAdd />
                </button>
              </div>
            ) : null}
            
            {existingProduct ? (
              <button
                onClick={() => handleBuyNow(product)}
                className="flex items-center justify-center h-8 px-2 sm:px-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{tr('BUY NOW','اشتري الآن')}</span>
                <span className="sm:hidden">{tr('BUY','شراء')}</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!selectedUnit || availableStock < 1}
                className={`w-full flex items-center justify-center py-1.5 px-2 sm:px-3 rounded text-xs sm:text-sm ${
                  !selectedUnit || availableStock < 1 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <IoBagAddSharp className="mr-1 text-xs" />
                <span className="hidden sm:inline">{tr('ADD TO CART','أضف إلى السلة')}</span>
                <span className="sm:hidden">{tr('ADD','أضف')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(ProductCard), { ssr: false });
