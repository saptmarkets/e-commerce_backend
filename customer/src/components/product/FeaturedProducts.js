import React from 'react';
import Link from 'next/link';
import ProductCardModern from "@components/product/ProductCardModern";
import CMSkeleton from "@components/preloader/CMSkeleton";

const FeaturedProducts = ({ 
  products, 
  loading, 
  error, 
  attributes, 
  promotions = [],
  title = "Top Picks", 
  description = "Discover our most popular products with amazing deals",
  viewAllLink = "/products", // Default to all products page
  isPromotional = false,
  cardVariant = "simple", // Changed default from "enhanced" to "simple"
  gridCols = "lg:grid-cols-3" // Updated default grid for simple cards
}) => {
  // Filter products with a discount
  const discountedProducts = products?.filter(product => product.discount > 0) || [];
  
  // Use discounted products if available, otherwise use all products
  const displayProducts = discountedProducts.length > 0 && !isPromotional ? discountedProducts : products;

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
    const cardProps = {
      product: product,
      attributes: attributes || [],
      promotion: productPromotion,
      compact: false,
      showQuantitySelector: true,
      showFavorite: true
    };

    // Use modern card to match All Products page - consistent implementation
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
    <div className={`${getBgColor()} py-10 md:py-12`}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${getTitleColor()} mb-2`}>{title}</h2>
          <p className="text-gray-600">{description}</p>
          
          {/* Special promotional details */}
          {isPromotional && promotions && promotions.length > 0 && (
            <div className="mt-3 text-sm text-gray-600 italic">
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
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6`}>
              {displayProducts?.slice(0, isPromotional ? 8 : 10).map((product) => {
                // Get matching promotion if this is a promotional section
                const productPromotion = getPromotionForProduct(product._id);
                
                return renderProductCard(product, productPromotion);
              })}
            </div>
          )}
          
          {!loading && (!products || products?.length === 0) && (
            <div className="text-center py-10">
              <p className="text-lg text-gray-500">No products found</p>
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link 
              href={linkDestination}
              className={`px-6 py-2.5 ${isPromotional ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md transition duration-200 font-medium inline-block`}
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts; 