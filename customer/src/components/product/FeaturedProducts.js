import React from 'react';
import Link from 'next/link';
import ProductCardModern from "@components/product/ProductCardModern";
import ProductCardCarousel from "@components/carousel/ProductCardCarousel";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from '@hooks/useUtilsFunction';

const FeaturedProducts = ({ 
  products, 
  loading, 
  error, 
  attributes, 
  promotions = [],
  excludeProductIds = new Set(),
  title = "Top Picks", 
  description = "Discover our most popular products with amazing deals",
  viewAllLink = "/products", // Default to all products page
  isPromotional = false,
  cardVariant = "simple", // Changed default from "enhanced" to "simple"
  gridCols = "lg:grid-cols-3" // Updated default grid for simple cards
}) => {
  const { tr } = useUtilsFunction();
  // Filter products with a discount
  const discountedProducts = products?.filter(product => product.discount > 0) || [];
  
  let baseProducts = discountedProducts.length > 0 && !isPromotional ? discountedProducts : products;

  // Exclude products present in excludeProductIds (used to hide special-offer products)
  if (excludeProductIds && excludeProductIds.size > 0) {
    baseProducts = baseProducts?.filter(p => !excludeProductIds.has(p._id || p.id));
  }

  const displayProducts = baseProducts;

  // If viewing discount products, set viewAllLink to /offer
  const isDiscountedSection = title === "Special Discounts" || title.toLowerCase().includes("discount");
  const linkDestination = isDiscountedSection ? "/offer" : viewAllLink;
  
  // Match promotions with products
  const getPromotionForProduct = (productId) => {
    if (!isPromotional || !promotions || promotions.length === 0) return null;
    return promotions.find(promo => promo.product && promo.product._id === productId);
  };
  
  // Color schemes based on section type
  const getBgColor = () => {
    if (isPromotional) return "bg-red-50";
    if (isDiscountedSection) return "bg-green-50";
    return "bg-gray-50";
  };
  
  const getTitleColor = () => {
    if (isPromotional) return "text-red-600";
    return "text-green-600";
  };

  // Determine the appropriate ProductCard component to use
  const renderProductCard = (product, productPromotion) => {
    const key = product._id;
    const hasPromotion = !!productPromotion;
    const cardProps = {
      product: product,
      attributes: attributes || [],
      promotion: productPromotion,
      compact: !hasPromotion, // smaller card if no promo
      showQuantitySelector: true,
      showFavorite: true
    };

    return <ProductCardModern key={key} {...cardProps} />;
  };

  // Determine grid layout based on card variant
  const getGridLayout = () => {
    // if (cardVariant === "advanced") return "lg:grid-cols-3"; // Larger cards need more space
    // if (cardVariant === "offer") return "lg:grid-cols-2"; // Promotional cards are wider
    if (cardVariant === "simple") return "lg:grid-cols-5"; // More cards per row like All Products page
    return gridCols; // Default or custom grid
  };
  
  return (
    <div className={`${getBgColor()} section-responsive`}>
      <div className="max-w-screen-2xl mx-auto responsive-padding">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className={`heading-responsive ${getTitleColor()} mb-1 sm:mb-2`}>{title}</h2>
          <p className="text-responsive-base text-gray-600">{description}</p>
          
          {/* Special promotional details */}
          {isPromotional && promotions && promotions.length > 0 && (
            <div className="mt-2 sm:mt-3 text-responsive-sm text-gray-600 italic">
              Limited time offers valid until {new Date(promotions[0].endDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="w-full">
          {loading ? (
            <CMSkeleton
              count={10}
              height={200}
              error={error}
              loading={loading}
            />
          ) : (
            <>
              {/* All screen sizes: horizontal carousel with infinite loop */}
              <ProductCardCarousel
                products={displayProducts?.slice(0, isPromotional ? 8 : 10)}
                attributes={attributes}
                slidesPerViewMobile={2}
                fixedSlidesPerView={5}
              />
            </>
          )}
          
          {!loading && (!products || products?.length === 0) && (
            <div className="text-center py-6 sm:py-8 md:py-10">
              <p className="text-responsive-lg text-gray-500">No products found</p>
            </div>
          )}
          
          <div className="text-center mt-6 sm:mt-8 md:mt-10">
            <Link 
              href={linkDestination}
              className={`inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-white rounded-md transition duration-200 ${isPromotional ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} no-underline`}
              style={{ minHeight: 'auto', lineHeight: '1.2' }}
            >
              {tr('View All', 'عرض الكل')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts; 