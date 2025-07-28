import useTranslation from "next-translate/useTranslation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { FiChevronRight, FiMinus, FiPlus, FiChevronDown } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
//internal import

import Price from "@components/common/Price";
import Stock from "@components/common/Stock";
import Tags from "@components/common/Tags";
import Layout from "@layout/Layout";
import { notifyError } from "@utils/toast";
import Card from "@components/slug-card/Card";
import useAddToCart from "@hooks/useAddToCart";
import useMultiUnits from "@hooks/useMultiUnits";
import useEnhancedMultiUnits from "@hooks/useEnhancedMultiUnits";
import Loading from "@components/preloader/Loading";
import ProductCardEnhanced from "@components/product/ProductCardEnhanced";
import VariantList from "@components/variants/VariantList";
import { SidebarContext } from "@context/SidebarContext";
import AttributeServices from "@services/AttributeServices";
import ProductServices from "@services/ProductServices";
import PromotionServices from "@services/PromotionServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import Discount from "@components/common/Discount";
import ImageCarousel from "@components/carousel/ImageCarousel";
import NeonSpinner from "@components/preloader/NeonSpinner";
import styles from "@styles/enhanced-product.module.css";

const ProductScreen = () => {
  const router = useRouter();
  const { slug } = router.query;

  const { lang, showingTranslateValue, getNumber, currency } = useUtilsFunction();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const { handleAddItem, item, setItem } = useAddToCart();
  
  // Enhanced multi-unit functionality
  const {
    selectedUnit,
    availableUnits,
    unitComparisonData,
    isLoadingUnits,
    activePromotion,
    isLoadingPromotion,
    availableStock: multiUnitStock,
    calculatePricing,
    hasMultipleUnits,
    priceUpdateKey,
    handleUnitSelection,
    getUnitDisplayName
  } = useEnhancedMultiUnits(product);

  // Optimized data fetching with React Query
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => await ProductServices.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const {
    data: attributes,
    isLoading: attributesLoading,
  } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => await AttributeServices.getShowingAttributes(),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: relatedProducts,
    isLoading: relatedLoading,
  } = useQuery({
    queryKey: ["relatedProducts", product?.category?._id],
    queryFn: async () => {
      if (!product?.category?._id) return [];
      return await ProductServices.getShowingStoreProducts({
        category: product.category._id,
      });
    },
    enabled: !!product?.category?._id,
    staleTime: 10 * 60 * 1000,
    cacheTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // react hook
  const [value, setValue] = useState("");
  const [price, setPrice] = useState(0);
  const [img, setImg] = useState("");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectVariant, setSelectVariant] = useState({});
  const [isReadMore, setIsReadMore] = useState(true);
  const [selectVa, setSelectVa] = useState({});
  const [variantTitle, setVariantTitle] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    if (value) {
      const result = product?.variants?.filter((variant) =>
        Object.keys(selectVa).every((k) => selectVa[k] === variant[k])
      );

      const res = result?.map(
        ({
          originalPrice,
          price,
          discount,
          quantity,
          barcode,
          sku,
          productId,
          image,
          ...rest
        }) => ({ ...rest })
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
      const originalPrice = getNumber(result2?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
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
      const originalPrice = getNumber(product.variants[0]?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
    } else if (product) {
      setStock(product?.stock);
      setImg(product?.image?.[0]);
      const price = getNumber(product?.prices?.price);
      const originalPrice = getNumber(product?.prices?.originalPrice);
      const discountPercentage = getNumber(
        ((originalPrice - price) / originalPrice) * 100
      );
      setDiscount(getNumber(discountPercentage));
      setPrice(price);
      setOriginalPrice(originalPrice);
    }
  }, [
    product?.prices?.discount,
    product?.prices?.originalPrice,
    product?.prices?.price,
    product?.stock,
    product?.variants,
    selectVa,
    selectVariant,
    value,
    product,
  ]);

  useEffect(() => {
    if (product?.variants && attributes) {
      const res = Object.keys(Object.assign({}, ...product?.variants));
      const varTitle = attributes?.filter((att) => res.includes(att?._id));
      setVariantTitle(varTitle?.sort());
    }
  }, [variants, attributes, product]);

  useEffect(() => {
    setIsLoading(false);
  }, [product]);

  // Enhanced promotional information display
  const renderPromotionalInfo = () => {
    if (!activePromotion) return null;
    
    const endDate = new Date(activePromotion.endDate);
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    const isEndingSoon = daysLeft <= 3;
    
    return (
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-lg">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold">
              {activePromotion.type === 'bulk_purchase' 
                ? `Buy ${activePromotion.requiredQty} Get ${activePromotion.freeQty} Free`
                : 'Special Offer'
              }
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (productLoading || !product) {
    return <Loading loading={true} />;
  }

  if (productError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
            <Link href="/">
              <a className="bg-emerald-500 text-white px-6 py-2 rounded-md hover:bg-emerald-600">
                Go Home
              </a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    const currentStock = hasMultipleUnits ? multiUnitStock : stock;
    if (currentStock <= 0) return notifyError("Insufficient stock");
    
    const currentPricing = calculatePricing || { finalPrice: price, basePrice: originalPrice };
    const newItem = {
      ...product,
      id: selectVariant._id || product._id,
      title: showingTranslateValue(product?.title),
      variant: selectVariant,
      price: currentPricing.finalPrice,
      originalPrice: currentPricing.basePrice,
      image: img,
      quantity: item.quantity || 1,
      // Multi-unit specific properties
      ...(hasMultipleUnits && selectedUnit && {
        selectedUnitId: selectedUnit._id,
        unitName: getUnitDisplayName(selectedUnit),
        packQty: selectedUnit.packQty,
        unitPrice: selectedUnit.price,
        pricePerBaseUnit: selectedUnit.price / selectedUnit.packQty,
        totalBaseUnits: selectedUnit.packQty * (item.quantity || 1),
        hasMultiUnits: true
      })
    };

    handleAddItem(newItem);
  };

  const category_name = showingTranslateValue(product?.category?.name);
  const { t } = useTranslation();

  // Calculate current pricing
  const currentPricing = calculatePricing || {
    finalPrice: hasMultipleUnits && selectedUnit ? selectedUnit.price : price,
    basePrice: hasMultipleUnits && selectedUnit ? selectedUnit.price : originalPrice,
    isPromotional: false,
    savings: 0,
    pricePerBaseUnit: hasMultipleUnits && selectedUnit ? selectedUnit.price / selectedUnit.packQty : price
  };

  return (
    <>
      <Layout>
        {/* 🧪 TEST BANNER - REMOVE AFTER TESTING */}
        <div className="bg-red-500 text-white text-center py-4 font-bold text-lg">
          🧪 TESTING: Fixed Price Promotion Logic - {new Date().toLocaleTimeString()}
          </div>

          {/* Main Product Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Product Images Section */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    {renderPromotionalInfo()}
                    <img
                      src={img || product?.image?.[0] || '/images/placeholder.svg'}
                      alt={showingTranslateValue(product?.title)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.svg';
                      }}
                    />
                  </div>
                  {/* Image Thumbnails */}
                  {product?.image?.length > 1 && (
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {product.image.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setImg(image)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            img === image || (!img && index === 0)
                              ? 'border-emerald-500 ring-2 ring-emerald-200'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Product Info Section */}
                <div className="space-y-6">
                  {/* Product Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {showingTranslateValue(product?.title)}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>SKU: {product?.sku}</span>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (hasMultipleUnits ? multiUnitStock : stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {(hasMultipleUnits ? multiUnitStock : stock) > 0 ? 
                          `${hasMultipleUnits ? multiUnitStock : stock} in stock` : 
                          'Out of stock'
                        }
                      </div>
                    </div>
                  </div>
                  {/* Enhanced Multi-Unit Selection */}
                  {hasMultipleUnits && unitComparisonData?.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Package Options</h3>
                        {isLoadingUnits && (
                          <NeonSpinner size="sm" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {unitComparisonData.map((unit) => {
                          const isSelected = selectedUnit?._id === unit._id;
                          const pricePerBase = unit.packQty > 1 ? unit.price / unit.packQty : unit.price;
                          return (
                            <button
                              key={unit._id}
                              onClick={() => handleUnitSelection(unit)}
                              className={`relative p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                                isSelected 
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">
                                  {unit.displayName || getUnitDisplayName(unit)}
                                </div>
                                {unit.packQty > 1 && (
                                  <div className="text-xs text-gray-500">
                                    Contains {unit.packQty} base units
                                  </div>
                                )}
                                <div className="font-bold text-emerald-600">
                                  {currency}{unit.price.toFixed(2)}
                                </div>
                                {unit.packQty > 1 && (
                                  <div className="text-xs text-gray-600">
                                    {currency}{pricePerBase.toFixed(2)} per unit
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                {/* Dynamic Pricing Section - COMMENTED OUT FOR TESTING */}
                {/* 
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div 
                      key={priceUpdateKey}
                      className="transition-all duration-300"
                    >
                      {currentPricing.isPromotional ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            <span className="text-lg font-semibold text-red-600">Special Price</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl font-bold text-red-600">
                              {currency}{currentPricing.finalPrice.toFixed(2)}
                            </span>
                            <span className="text-xl text-gray-500 line-through">
                              {currency}{currentPricing.basePrice.toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                              Save {currency}{currentPricing.savings.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl font-bold text-emerald-600">
                            {currency}{currentPricing.finalPrice.toFixed(2)}
                          </span>
                          <span className="text-gray-600">per package</span>
                        </div>
                      )}
                      
                      {selectedUnit?.packQty > 1 && (
                        <div className="mt-2 text-sm text-gray-600">
                          {currency}{currentPricing.pricePerBaseUnit.toFixed(2)} per base unit
                        </div>
                      )}
                    </div>
                  </div>
                */}
                {/* TEST: Fixed Price Promotion Logic */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-yellow-800">🧪 TESTING FIXED PRICE PROMOTION LOGIC</h3>
                    <p className="text-sm text-yellow-700">This is a test implementation to verify the logic</p>
                  </div>
                  {/* Test Data Display */}
                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <strong>Active Promotion:</strong> {activePromotion ? 'YES' : 'NO'}
                      {activePromotion && (
                        <div className="mt-2 space-y-1 text-xs">
                          <div>Type: {activePromotion.type}</div>
                          <div>Min Qty: {activePromotion.minQty || 'N/A'}</div>
                          <div>Fixed Price: {activePromotion.fixedPrice || 'N/A'}</div>
                          <div>Value: {activePromotion.value || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong>Current Pricing:</strong>
                      <div className="mt-2 space-y-1 text-xs">
                        <div>Base Price: {currency}{currentPricing.basePrice.toFixed(2)}</div>
                        <div>Final Price: {currency}{currentPricing.finalPrice.toFixed(2)}</div>
                        <div>Is Promotional: {currentPricing.isPromotional ? 'YES' : 'NO'}</div>
                      </div>
                    </div>
                  </div>
                  {/* NEW LOGIC: Fixed Price Promotion Display */}
                  <div className="mt-4 bg-white p-4 rounded border">
                    <h4 className="font-bold text-gray-800 mb-3">🎯 NEW FIXED PRICE DISPLAY LOGIC:</h4>
                    {activePromotion && activePromotion.type === 'fixed_price' && activePromotion.fixedPrice ? (
                      <div className="space-y-2">
                        {/* Main Price Display - Shows minimum total price */}
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-red-600">
                            {currency}{(activePromotion.fixedPrice * (activePromotion.minQty || 1)).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">for {activePromotion.minQty || 1} units</span>
                        </div>
                        {/* Per-unit price in smaller text */}
                        <div className="text-sm text-gray-600">
                          {currency}{activePromotion.fixedPrice.toFixed(2)} per unit
                        </div>
                        {/* Original price comparison */}
                        <div className="text-sm text-gray-500 line-through">
                          Regular price: {currency}{(currentPricing.basePrice * (activePromotion.minQty || 1)).toFixed(2)}
                        </div>
                        {/* Savings */}
                        <div className="text-sm text-green-600 font-medium">
                          Save {currency}{((currentPricing.basePrice * (activePromotion.minQty || 1)) - (activePromotion.fixedPrice * (activePromotion.minQty || 1))).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Regular price display */}
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-emerald-600">
                            {currency}{currentPricing.finalPrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">per unit</span>
                        </div>
                        {activePromotion && (
                          <div className="text-sm text-blue-600">
                            ⚠️ Promotion exists but not fixed_price type: {activePromotion.type}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                  {/* Quantity Selector */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900">Quantity</label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => setItem(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                          disabled={(item.quantity || 1) <= 1}
                          className="p-3 text-gray-600 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiMinus size={18} />
                        </button>
                        <span className="px-4 py-3 font-semibold min-w-[60px] text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => setItem(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))}
                          disabled={(item.quantity || 1) >= (hasMultipleUnits ? multiUnitStock : stock)}
                          className="p-3 text-gray-600 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiPlus size={18} />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {(hasMultipleUnits ? multiUnitStock : stock) > 0 ? (
                          `${hasMultipleUnits ? multiUnitStock : stock} available`
                        ) : (
                          <span className="text-red-500">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Total Price */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-700">Total Price:</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {currency}{(currentPricing.finalPrice * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                    {currentPricing.isPromotional && (
                      <div className="text-sm text-red-600 mt-1">
                        Total savings: {currency}{(currentPricing.savings * (item.quantity || 1)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={(hasMultipleUnits ? multiUnitStock : stock) === 0}
                    className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg
                              hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                              transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                              shadow-lg hover:shadow-xl"
                  >
                    {(hasMultipleUnits ? multiUnitStock : stock) === 0 ? 
                      'Out of Stock' : 
                      `Add to Cart • ${currency}${(currentPricing.finalPrice * (item.quantity || 1)).toFixed(2)}`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts?.products && relatedProducts.products.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {relatedProducts.products.slice(0, 8).map((relatedProduct) => (
                    <div key={relatedProduct._id} className="group">
                      <Link href={`/product/${relatedProduct.slug}`}>
                        <a className="block bg-gray-50 rounded-xl overflow-hidden transition-all duration-200 group-hover:shadow-md">
                          <div className="aspect-square relative">
                            <img
                              src={relatedProduct.image?.[0] || '/images/placeholder.svg'}
                              alt={showingTranslateValue(relatedProduct?.title)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                              {showingTranslateValue(relatedProduct?.title)}
                            </h3>
                            <div className="text-emerald-600 font-bold">
                              {currency}{(relatedProduct.price || 0).toFixed(2)}
                            </div>
                          </div>
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default ProductScreen;
