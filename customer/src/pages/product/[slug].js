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
        limit: 8,
        exclude: product._id
      });
    },
    enabled: !!product?.category?._id,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // State management
  const [img, setImg] = useState("");
  const [selectVariant, setSelectVariant] = useState({});
  const [selectVa, setSelectVa] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantTitle, setVariantTitle] = useState([]);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [stock, setStock] = useState(0);

  // Set initial values when product loads
  useEffect(() => {
    if (product) {
      setImg(product?.image?.[0]);
      setPrice(product?.prices?.price || 0);
      setOriginalPrice(product?.prices?.originalPrice || product?.prices?.price || 0);
      setStock(product?.stock || 0);
    }
  }, [product]);

  useEffect(() => {
    setIsLoading(false);
  }, [product]);

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

  return (
    <>
      <Layout>
        {/* Main Product Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Product Images Section */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
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

                {/* Price Display */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {/* Regular price display */}
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl font-bold text-emerald-600">
                          {currency}{currentPricing.finalPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">per unit</span>
                      </div>
                      {activePromotion && (
                        <div className="text-sm text-blue-600">
                          Special promotion available
                        </div>
                      )}
                    </div>
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
