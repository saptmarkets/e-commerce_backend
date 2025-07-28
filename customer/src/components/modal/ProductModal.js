import useTranslation from "next-translate/useTranslation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState, useMemo } from "react";
import { FiMinus, FiPlus, FiX, FiShoppingCart, FiHeart, FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { IoFlashOutline, IoCheckmarkCircle } from "react-icons/io5";

//internal import
import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import Tags from "@components/common/Tags";
import { notifyError, notifySuccess } from "@utils/toast";
import useAddToCart from "@hooks/useAddToCart";
import MainModal from "@components/modal/MainModal";
import Discount from "@components/common/Discount";
import VariantList from "@components/variants/VariantList";
import { SidebarContext } from "@context/SidebarContext";
import { getUnitDisplayName as getLocalizedUnitDisplayName } from "@utils/unitUtils";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useMultiUnits from "@hooks/useMultiUnits";
import PromotionServices from "@services/PromotionServices";
import { handleLogEvent } from "src/lib/analytics";

const ProductModal = ({
  modalOpen,
  setModalOpen,
  product,
  attributes,
  currency,
  promotion,
}) => {
  const router = useRouter();
  const { setIsLoading, isLoading } = useContext(SidebarContext);
  const { t } = useTranslation("common");

  const { handleAddItem, setItem, item } = useAddToCart();
  const { lang, showingTranslateValue, getNumber, getNumberTwo } = useUtilsFunction();

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
    getPricingBreakdown,
    fetchProductUnits
  } = useMultiUnits(product);

  // State management
  const [value, setValue] = useState("");
  const [price, setPrice] = useState(0);
  const [img, setImg] = useState("");
  const [stock, setStock] = useState(0);
  const [selectVariant, setSelectVariant] = useState({});
  const [selectVa, setSelectVa] = useState({});
  const [variantTitle, setVariantTitle] = useState([]);
  const [variants, setVariants] = useState([]);
  const [activePromotion, setActivePromotion] = useState(promotion);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [promotionalUnits, setPromotionalUnits] = useState(new Set()); // Store IDs of promotional units
  const [unitPromotions, setUnitPromotions] = useState(new Map()); // Map unitId -> promotion object
  
  // Image carousel functionality
  const productImages = useMemo(() => {
    if (product?.image && Array.isArray(product.image) && product.image.length > 0) {
      return product.image.filter(img => img && img.trim() !== '');
    }
    return ['/images/placeholder.svg']; // Fallback to placeholder
  }, [product?.image]);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const selectImage = (index) => {
    setSelectedImageIndex(index);
  };

  useEffect(() => {
    if (promotion) {
      setActivePromotion(promotion);
    }
  }, [promotion]);

  // Scan all units for promotions and store promotional unit IDs
  const scanAllUnitsForPromotions = async () => {
    if (!unitComparisonData?.length) return;
    
    try {
      const promotionalUnitIds = new Set();
      const promoMap = new Map();
      
      // Check each unit for promotions
      for (const unit of unitComparisonData) {
        try {
          const unitPromotions = await PromotionServices.getPromotionsByProductUnit(unit._id);
          if (unitPromotions && unitPromotions.length > 0) {
            promotionalUnitIds.add(unit._id);
            promoMap.set(unit._id, unitPromotions[0]);
          }
        } catch (error) {
          console.warn(`Error fetching promotions for unit ${unit._id}:`, error);
        }
      }
      
      setPromotionalUnits(promotionalUnitIds);
      setUnitPromotions(promoMap);
      
      console.log('ProductModal: Promotional units found:', {
        promotionalUnitIds: Array.from(promotionalUnitIds),
        unitComparisonData: unitComparisonData.map(u => ({ id: u._id, name: u.displayName }))
      });
      
    } catch (error) {
      console.error('Error scanning units for promotions:', error);
    }
  };

  // Scan for promotional units when modal opens and units are available
  useEffect(() => {
    if (modalOpen && unitComparisonData?.length > 0) {
      scanAllUnitsForPromotions();
    }
  }, [modalOpen, unitComparisonData]);

  // Fetch unit-specific promotions when selectedUnit changes
  useEffect(() => {
    const fetchUnitPromotions = async () => {
      if (!selectedUnit?._id) return;
      
      try {
        // First try to get unit-specific promotions
        const unitPromotions = await PromotionServices.getPromotionsByProductUnit(selectedUnit._id);
        if (unitPromotions && unitPromotions.length > 0) {
          setActivePromotion(unitPromotions[0]);
        } else {
          // If no unit-specific promotion, clear promotion for this unit
          setActivePromotion(null);
        }
      } catch (error) {
        console.error('Error fetching unit promotions:', error);
        setActivePromotion(null);
      }
    };

    if (selectedUnit) {
      fetchUnitPromotions();
    }
  }, [selectedUnit]);

  // 1. Set initial quantity to minQty on modal open or promo change
  useEffect(() => {
    if (modalOpen && activePromotion && activePromotion.minQty) {
      setItem(activePromotion.minQty);
    } else if (modalOpen) {
      setItem(1);
    }
  }, [modalOpen, activePromotion]);

  // 2. Dynamic pricing logic: advanced promo breakdown for min/max
  const pricingInfo = useMemo(() => {
    let basePrice = 0;
    let finalPrice = 0;
    let isPromotional = false;
    let savings = 0;
    let minQty = activePromotion ? (activePromotion.minQty || 1) : 1;
    let maxQty = activePromotion && activePromotion.maxQty ? activePromotion.maxQty : null;
    let promoUnits = 0;
    let normalUnits = 0;
    let promoUnitPrice = 0;
    let normalUnitPrice = 0;
    let breakdown = '';

    if (selectedUnit && product?.hasMultiUnits) {
      basePrice = selectedUnit.price || 0;
    } else if (product?.variants?.length > 0 && selectVariant?.price) {
      basePrice = getNumber(selectVariant.price);
    } else {
      basePrice = getNumber(product?.prices?.price || product?.price || 0);
    }
    normalUnitPrice = basePrice;

    // Default: all at normal price
    finalPrice = basePrice;
    promoUnitPrice = basePrice;
    promoUnits = 0;
    normalUnits = item;
    isPromotional = false;
    savings = 0;

    if (activePromotion && item >= minQty) {
      const isUnitSpecificPromotion = !selectedUnit || 
        (activePromotion.productUnit && activePromotion.productUnit._id === selectedUnit._id);
      if (isUnitSpecificPromotion) {
        if (activePromotion.type === 'fixed_price') {
          promoUnitPrice = activePromotion.value || activePromotion.offerPrice || basePrice;
          if (maxQty && item > maxQty) {
            promoUnits = maxQty;
            normalUnits = item - maxQty;
          } else {
            promoUnits = item;
            normalUnits = 0;
          }
          finalPrice = promoUnitPrice;
          isPromotional = promoUnits > 0;
          savings = (basePrice - promoUnitPrice) * promoUnits;
          
          // Fix currency issue in breakdown
          breakdown = `${promoUnits} × ${promoUnitPrice.toFixed(2)}`;
          if (normalUnits > 0) {
            breakdown += ` + ${normalUnits} × ${basePrice.toFixed(2)}`;
          }
        } else if (activePromotion.type === 'bulk_purchase') {
          const totalRequired = activePromotion.requiredQty || activePromotion.minQty || 1;
          const freeQty = activePromotion.freeQty || 0;
          const originalPrice = activePromotion.originalPrice || 
            activePromotion.productUnit?.price || basePrice;
          const effectivePrice = (originalPrice * totalRequired) / (totalRequired + freeQty);
          finalPrice = effectivePrice;
          savings = originalPrice - effectivePrice;
          isPromotional = true;
          basePrice = originalPrice;
        }
      }
    }

    return {
      basePrice: Math.max(0, basePrice),
      finalPrice: Math.max(0, finalPrice),
      savings: Math.max(0, savings),
      isPromotional,
      pricePerBaseUnit: selectedUnit?.packQty ? finalPrice / selectedUnit.packQty : finalPrice,
      promoUnits,
      normalUnits,
      promoUnitPrice,
      normalUnitPrice,
      breakdown
    };
  }, [selectedUnit, product, selectVariant, activePromotion, item, currency]);

  // 3. Counter logic: respect minimum quantity for promotions
  const handleDecrease = () => {
    const minQty = activePromotion ? (activePromotion.minQty || 1) : 1;
    if (item > minQty) setItem(item - 1);
  };
  const handleIncrease = () => {
    setItem(item + 1);
  };

  useEffect(() => {
    if (value) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      const res = result?.map(
        ({ price, quantity, barcode, sku, productId, image, ...rest }) => ({ ...rest })
      );

      const filterKey = Object.keys(Object.assign({}, ...res));
      const selectVar = filterKey?.reduce(
        (obj, key) => ({ ...obj, [key]: selectVariant[key] }),
        {}
      );
      const newObj = Object.entries(selectVar).reduce(
        (a, [k, v]) => (v ? ((a[k] = v), a) : a),
        {}
      );

      const result2 = result?.find((v) =>
        Object.keys(newObj).every((k) => newObj[k] === v[k])
      );

      if (result.length <= 0 || result2 === undefined) return setStock(0);

      setVariants(result);
      setSelectVariant(result2);
      setSelectVa(result2);
      setImg(result2?.image);
      setStock(result2?.quantity);
      const price = getNumber(result2?.price);
      setPrice(price);
    } else if (product?.variants?.length > 0) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      setVariants(result);
      setStock(product.variants[0]?.quantity);
      setSelectVariant(product.variants[0]);
      setSelectVa(product.variants[0]);
      setImg(product.variants[0]?.image);
      const price = getNumber(product.variants[0]?.price);
      setPrice(price);
    } else {
      if (selectedUnit && product?.hasMultiUnits) {
        setStock(availableStock);
        setImg(product?.image?.[0]);
        const price = getNumber(selectedUnit.price);
        setPrice(price);
      } else {
        setStock(product?.stock);
        setImg(product?.image?.[0]);
        const price = getNumber(product?.prices?.price || product?.price || 0);
        setPrice(price);
      }
    }
  }, [
    product?.prices?.price,
    product?.price,
    product?.stock,
    product.variants,
    selectVa,
    selectVariant,
    value,
    selectedUnit,
    availableStock,
    product?.hasMultiUnits,
  ]);

  useEffect(() => {
    const res = product?.variants && product.variants.length > 0 
      ? Object.keys(Object.assign({}, ...product.variants)) 
      : [];

    const varTitle = attributes?.filter((att) => res.includes(att?._id));
    setVariantTitle(varTitle?.sort());
  }, [variants, attributes, product?.variants]);

  const handleAddToCart = (p) => {
    if (p.hasMultiUnits && !selectedUnit) {
      return notifyError("Please select a unit!");
    }

    if (p.hasMultiUnits && !isValidUnit) {
      return notifyError("Selected unit is not available!");
    }

    if (p.variants && p.variants.length === 1 && p.variants[0].quantity < 1)
      return notifyError("Insufficient stock");

    if (stock <= 0) return notifyError("Insufficient stock");

    if (
      !p.variants || p.variants.length === 0 || 
      (product?.variants && product.variants.length > 0 && 
        product.variants.some(
          (variant) =>
            Object.entries(variant).sort().toString() ===
            Object.entries(selectVariant).sort().toString()
        ))
    ) {
      const { variants, categories, description, ...updatedProduct } = product;
      
      let itemPrice = pricingInfo.finalPrice;
      
      const cartItem = {
        ...updatedProduct,
        title: showingTranslateValue(p?.title),
        id: selectedUnit ? `${p._id}-${selectedUnit._id}` : p._id,
        productId: p._id,
        selectedUnitId: selectedUnit?._id,
        variant: selectedUnit || selectVariant || { price: itemPrice },
        price: itemPrice,
        unitPrice: selectedUnit?.price || itemPrice,
        image: img || p.image?.[0],
        promotion: activePromotion,
        promotionPrice: activePromotion ? pricingInfo.finalPrice : null,
        minQty: activePromotion ? activePromotion.minQty : 1,
        maxQty: activePromotion ? activePromotion.maxQty : null,
        basePrice: pricingInfo.basePrice,
        baseProductPrice: product?.price || pricingInfo.basePrice,
        originalPrice: selectedUnit?.originalPrice || pricingInfo.basePrice,
        // Multi-unit information
        unitName: getLocalizedUnitDisplayName(selectedUnit, lang) || 'Unit',
        unitValue: selectedUnit?.unitValue || 1,
        packQty: selectedUnit?.packQty || 1,
        unitType: selectedUnit?.unitType || 'multi',
        sku: selectedUnit?.sku || product?.sku || '',
        barcode: selectedUnit?.barcode || product?.barcode || '',
        // Promotional and metadata
        isPromotional: pricingInfo.isPromotional,
        savings: pricingInfo.savings,
        isMultiUnit: product?.hasMultiUnits || Boolean(selectedUnit)
      };

      handleAddItem(cartItem, item);
      notifySuccess(`${item} ${selectedUnit?.unit?.name || 'item(s)'} added to cart!`);
      setModalOpen(false);
    }
  };

  const handleMoreInfo = (slug) => {
    handleLogEvent("product", "view_product_details", {
      product_id: product._id,
      product_name: showingTranslateValue(product?.title),
      method: "product_modal"
    });
    setModalOpen(false);
    router.push(`/product/${slug}`);
  };

  const category_name = showingTranslateValue(product?.category?.name);

  if (!product) return null;

  return (
    <>
      <MainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <div
          className="bg-white rounded-2xl shadow-xl mx-auto my-8 w-full max-w-2xl p-6 relative
          sm:max-w-[95vw] sm:p-3 sm:text-[0.92rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{t('productDetails')}</h2>
            <button
                onClick={() => setModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/2 p-4">
              <div className="relative">
                {/* Promotion Badge */}
                {pricingInfo.isPromotional && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full z-10 text-xs font-bold shadow-lg">
                    <div className="flex items-center space-x-1">
                      <IoFlashOutline size={12} />
                      <span>SPECIAL OFFER</span>
                    </div>
                  </div>
                )}

                {/* Favorite Button */}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all z-10 hover:scale-110"
                >
                  <FiHeart className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} size={18} />
                </button>

                {/* Main Image with Navigation */}
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 group">
                  <Image
                    src={productImages[selectedImageIndex]}
                    alt={showingTranslateValue(product?.title)}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      if (!e.target.dataset.fallbackSet) {
                        e.target.dataset.fallbackSet = 'true';
                        e.target.src = '/images/placeholder.svg';
                      }
                    }}
                  />
                  
                  {/* Navigation Arrows - Only show if multiple images */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      >
                        <FiChevronLeft size={20} className="text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      >
                        <FiChevronRight size={20} className="text-gray-700" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {productImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                      {selectedImageIndex + 1} / {productImages.length}
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => selectImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:border-blue-400 ${
                          index === selectedImageIndex 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${showingTranslateValue(product?.title)} - Image ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.target.dataset.fallbackSet) {
                              e.target.dataset.fallbackSet = 'true';
                              e.target.src = '/images/placeholder.svg';
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Image Dots Indicator for smaller screens */}
                {productImages.length > 1 && (
                  <div className="flex justify-center space-x-1 mt-3 md:hidden">
                    {productImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => selectImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === selectedImageIndex ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="lg:w-1/2 p-4 space-y-4">
              {/* Title and Rating */}
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {showingTranslateValue(product?.title)}
                  </h1>
                
                {product.rating && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          size={14}
                        />
                      ))}
                </div>
                    <span className="text-xs text-gray-600">
                      {product.rating.toFixed(1)} ({product.reviewCount || 0} {t('reviews')})
                    </span>
                  </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center space-x-4 text-xs">
                  {(product.hasMultiUnits ? availableStock : stock) > 0 ? (
                    <span className="flex items-center text-green-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                      {product.hasMultiUnits ? availableStock : stock} {t('inStock')}
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                      {t('outOfStock')}
                    </span>
                  )}
                  {product.sku && (
                    <span className="text-gray-500">{t('sku')}: {product.sku}</span>
                  )}
                </div>
              </div>

              {/* Unit Selection */}
              {hasMultipleUnits && unitComparisonData?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{t('selectPackage')}</h4>
                  <div className="space-y-1">
                    {unitComparisonData.map((unit) => {
                      const isSelected = selectedUnit?._id === unit._id;
                      // Enhanced promotion detection - use stored promotional units
                      const hasPromotion = promotionalUnits.has(unit._id) || 
                        (activePromotion && (
                          // Direct unit match
                          activePromotion.productUnit?._id === unit._id ||
                          activePromotion.unit?._id === unit._id ||
                          // Check if this unit matches the promotional unit description
                          (promotion && (
                            promotion.productUnit?._id === unit._id ||
                            promotion.unit?._id === unit._id
                          )) ||
                          // Try to match by unit type (e.g., if promotion mentions "ctn12" and this unit is ctn12)
                          (activePromotion?.productUnit?.unit?.shortCode && 
                           unit.unit?.shortCode === activePromotion.productUnit.unit.shortCode &&
                           unit.unitValue === activePromotion.productUnit.unitValue) ||
                          // Check if this unit has savings compared to its original price
                          (product.promotion && product.promotion.unit && 
                           unit.unit?.shortCode === product.promotion.unit.unit?.shortCode &&
                           unit.unitValue === product.promotion.unit.unitValue)
                        ));
                      
                      // Debug logging for modal
                      if (unit.unit?.shortCode === 'ctn' && unit.unitValue === 12) {
                        console.log('DEBUG: ProductModal ctn12 unit analysis:', {
                          unitId: unit._id,
                          unitName: `${unit.unitValue} ${unit.unit?.shortCode}`,
                          hasPromotion,
                          isInPromotionalUnits: promotionalUnits.has(unit._id),
                          promotionalUnitsSize: promotionalUnits.size,
                          activePromotion: activePromotion ? {
                            id: activePromotion._id,
                            productUnitId: activePromotion.productUnit?._id,
                            unitId: activePromotion.unit?._id,
                            productUnitShortCode: activePromotion.productUnit?.unit?.shortCode,
                            productUnitValue: activePromotion.productUnit?.unitValue
                          } : null,
                          promotion: promotion ? {
                            id: promotion._id,
                            productUnitId: promotion.productUnit?._id,
                            unitId: promotion.unit?._id
                          } : null
                        });
                      }
                      
                      return (
                          <button
                            key={unit._id}
                          onClick={() => handleUnitSelection(unit)}
                          className={`w-full p-3 border-2 rounded-lg text-left transition-all relative ${
                            hasPromotion
                              ? 'border-red-500 bg-red-50 hover:border-red-600 hover:bg-red-100 text-red-700' // Always red for promotional units
                              : isSelected
                                ? 'border-blue-500 bg-blue-50 shadow-md text-blue-800'
                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm flex items-center space-x-2">
                                <span>{getLocalizedUnitDisplayName(unit, lang)}</span>
                                {hasPromotion && (
                                  <span className="text-red-500 animate-pulse">🔥</span>
                                )}
                              </div>
                              {unit.packQty > 1 && (
                              <div className="text-xs text-gray-500">
                                {t('contains')} {unit.packQty} {t('baseUnits')}
                              </div>
                              )}
                              {hasPromotion && (
                                <div className="text-xs font-medium text-red-600 mt-1">
                                  🔥 {t('specialOfferAvailable')}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {hasPromotion ? (
                                (() => {
                                  // Try to locate the unit promotion data (either from activePromotion or by API call earlier)
                                  const unitPromo = unitPromotions.get(unit._id) || (activePromotion && activePromotion.productUnit && activePromotion.productUnit._id === unit._id ? activePromotion : null);
                                  const promoPrice = unitPromo ? (unitPromo.value || unitPromo.offerPrice || unit.price) : unit.price;
                                  const minQtyPromo = unitPromo ? (unitPromo.minQty || unitPromo.requiredQty || 1) : 1;
                                  const maxQtyPromo = unitPromo ? (unitPromo.maxQty || unitPromo.requiredQty || null) : null;
                                  const basePrice = unit.price;
                                  return (
                                    <div className="flex flex-col items-end">
                                      <span className="text-base font-bold text-red-600">
                                        {currency}{(promoPrice * minQtyPromo).toFixed(2)}
                                      </span>
                                      <span className="text-xs text-gray-500 font-normal mt-1">
                                        ({minQtyPromo} × {currency}{promoPrice.toFixed(2)})
                                      </span>
                                      <span className="text-xs line-through text-gray-400">
                                        {currency}{(basePrice * minQtyPromo).toFixed(2)}
                                      </span>
                                      <div className="text-[10px] text-red-600 mt-1">🔥 {t('min')} {minQtyPromo}</div>
                                      {maxQtyPromo && (
                                        <div className="text-[10px] text-red-600">🔥 {t('max')} {maxQtyPromo}</div>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <>
                                  <div className="font-bold text-sm text-blue-600">
                                    {currency}{getNumberTwo(unit.price)}
                                  </div>
                                  {unit.packQty > 1 && (
                                    <div className="text-xs text-gray-500">
                                      {currency}{getNumberTwo(unit.pricePerBase || 0)} / {t('unit')}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            {isSelected && (
                              <IoCheckmarkCircle className={`ml-2 ${hasPromotion ? 'text-red-500' : 'text-blue-500'}`} size={16} />
                            )}
                            {hasPromotion && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                                🔥
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variants */}
              {variantTitle?.map((a) => (
                <div key={a._id} className="space-y-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                      {showingTranslateValue(a?.name)}:
                    </h4>
                      <VariantList
                        att={a._id}
                        lang={lang}
                        option={a.option}
                        setValue={setValue}
                        varTitle={variantTitle}
                        variants={product?.variants}
                        setSelectVa={setSelectVa}
                        selectVariant={selectVariant}
                        setSelectVariant={setSelectVariant}
                      />
                    </div>
              ))}

              {/* Pricing */}
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="transition-all duration-300">
                  {pricingInfo.isPromotional ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <IoFlashOutline className="text-red-500" size={14} />
                        <span className="text-xs font-medium text-red-600">{t('specialPrice')}</span>
                        {activePromotion?.endDate && (
                          <span className="text-xs text-gray-500">
                            • {Math.ceil((new Date(activePromotion.endDate) - new Date()) / (1000 * 60 * 60 * 24))} {t('daysLeft')}
                          </span>
                        )}
                      </div>
                      {/* Fixed Price Promo Calculation Display */}
                      {activePromotion && activePromotion.type === 'fixed_price' ? (
                        <div className="flex flex-col items-start">
                          <span className="text-xl font-bold text-red-600">
                            {currency}{(pricingInfo.finalPrice * (activePromotion.minQty || 1)).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 font-normal mt-1">
                            ({activePromotion.minQty || 1} × {currency}{pricingInfo.finalPrice.toFixed(2)})
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {currency}{(pricingInfo.basePrice * (activePromotion.minQty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-red-600">
                          {currency}{pricingInfo.finalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {currency}{pricingInfo.basePrice.toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                          {t('save')} {currency}{pricingInfo.savings.toFixed(2)}
                        </span>
                      </div>
                      )}
                      {/* Unit and Min/Max/Per Base Unit Info - compact arrangement */}
                      {(selectedUnit || (activePromotion && (activePromotion.minQty || activePromotion.maxQty))) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                      {selectedUnit && (
                            <span>/ {getLocalizedUnitDisplayName(selectedUnit, lang)}</span>
                      )}
                      {activePromotion && (
                            <span>
                              {t('min')}: {activePromotion.minQty || 1}
                                {activePromotion.maxQty && (
                                <span className="ml-2">{t('max')}: {activePromotion.maxQty}</span>
                                )}
                            </span>
                          )}
                          {selectedUnit?.packQty > 1 && (
                            <span>{currency}{pricingInfo.pricePerBaseUnit.toFixed(2)} {t('perBaseUnit')}</span>
                          )}
                        </div>
                      )}
                      {/* Promotional Offer Details */}
                      {activePromotion && activePromotion.type !== 'fixed_price' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                          <div className="text-xs font-medium text-red-700">
                            {(() => {
                              const promotionUnit = activePromotion.productUnit || selectedUnit;
                              let unitDisplayName;
                              const shortCode = promotionUnit?.unit?.shortCode || promotionUnit?.shortCode || selectedUnit?.unit?.shortCode || selectedUnit?.shortCode;
                              const nameAr = promotionUnit?.unit?.nameAr || promotionUnit?.nameAr || selectedUnit?.unit?.nameAr || selectedUnit?.nameAr;
                              if (nameAr && lang === 'ar') {
                                unitDisplayName = nameAr;
                              } else if (shortCode) {
                                const shortCodeMap = {
                                  'pcs': lang === 'ar' ? 'قطعة' : 'pcs',
                                  'CTN': lang === 'ar' ? 'كرتون' : 'CTN',
                                  'ctn': lang === 'ar' ? 'كرتون' : 'ctn',
                                  'kg': lang === 'ar' ? 'كيلو' : 'kg',
                                  'g': lang === 'ar' ? 'جرام' : 'g'
                                };
                                unitDisplayName = shortCodeMap[shortCode] || shortCode;
                              } else {
                                unitDisplayName = getLocalizedUnitDisplayName(selectedUnit, lang);
                              }
                              const unitValue = promotionUnit?.unitValue || 1;
                              return `${t('get')} ${activePromotion.minQty || 1} ${unitDisplayName} ${t('for')}`;
                            })()}
                          </div>
                          <div className="text-sm font-bold text-red-600">
                            {currency}{pricingInfo.finalPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-red-600">
                            {t('insteadOf')} {currency}{pricingInfo.basePrice.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-emerald-600">
                          {currency}{pricingInfo.finalPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">{t('perPackage')}</span>
                      </div>
                      
                      {/* Unit Information for regular products */}
                      {selectedUnit && (
                        <div className="text-xs text-gray-600">
                          / {getLocalizedUnitDisplayName(selectedUnit, lang)}{selectedUnit.unitValue > 1 ? ` ${selectedUnit.unitValue}` : ''}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedUnit?.packQty > 1 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {currency}{pricingInfo.pricePerBaseUnit.toFixed(2)} {t('perBaseUnit')}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-3">
                {/* Quantity Selector – always visible, defaulting to promotion minQty if applicable */}
                  {true && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">{t('quantity')}</label>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={handleDecrease}
                        disabled={item === (activePromotion ? (activePromotion.minQty || 1) : 1)}
                          className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="px-3 py-2 font-medium min-w-[50px] text-center text-sm">
                          {item}
                        </span>
                      <button
                        onClick={handleIncrease}
                        disabled={
                          (product.hasMultiUnits ? availableStock : product.quantity) < item || 
                          (product.hasMultiUnits ? availableStock : product.quantity) === item
                        }
                          className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                          <FiPlus size={14} />
                      </button>
                      </div>
                    </div>
                    </div>
                  )}

                {/* Minimum Quantity Notice */}
                  {activePromotion && activePromotion.minQty > 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <span className="text-xs font-medium text-yellow-800">
                        {t('minimumQuantity')}: {activePromotion.minQty}
                      </span>
                  </div>
                )}

                {/* Total Price */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 text-sm">{t('total')}:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {currency}{(pricingInfo.promoUnits * pricingInfo.promoUnitPrice + pricingInfo.normalUnits * pricingInfo.normalUnitPrice).toFixed(2)}
                    </span>
                  </div>
                  {pricingInfo.isPromotional && (
                    <div className="text-xs text-red-600 mt-1">
                      {t('totalSavings')}: {currency}{pricingInfo.savings.toFixed(2)}
                    </div>
                  )}
                  {/* Show breakdown if promo applies */}
                  {pricingInfo.isPromotional && (
                    <div className="text-xs text-gray-500 mt-1">
                      {pricingInfo.breakdown}
                    </div>
                  )}
                </div>

                {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={(product.hasMultiUnits ? availableStock : product.quantity) < 1}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl ${
                      activePromotion ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                  <FiShoppingCart size={16} />
                  <span className="text-sm">{t('addToCart')}</span>
                  </button>
              </div>

              {/* Product Info */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600">{t('category')}: </span>
                      <Link
                        href={`/category/${product?.category?._id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          {category_name}
                      </Link>
                  </div>
                    <button
                      onClick={() => handleMoreInfo(product.slug)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                    {t('viewFullDetails')} →
                    </button>
                </div>

                {product?.tag && typeof product.tag === 'string' && product.tag.trim() !== '' && (
                  <Tags product={product} />
                )}
              </div>
            </div>
          </div>
        </div>
      </MainModal>
    </>
  );
};

export default ProductModal;
