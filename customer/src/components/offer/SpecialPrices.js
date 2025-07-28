import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/router';
import { IoPricetagOutline, IoArrowForward } from 'react-icons/io5';

// Internal imports
import PromotionServices from "@services/PromotionServices";
import ProductUnitServices from "@services/ProductUnitServices";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";
import ProductCardCarousel from "@components/carousel/ProductCardCarousel";

const SpecialPrices = ({ 
  title = "Special Prices", 
  description = "Amazing fixed price deals on selected products",
  maxItems = 8,
  attributes
}) => {
  const router = useRouter();
  const { showingTranslateValue, getNumberTwo, tr, lang } = useUtilsFunction();

  // Fetch active promotions instead of general products
  const { data: activePromotions, error, isLoading } = useQuery({
    queryKey: ["active-promotions-for-special-offers"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
  });

  // Filter and prepare products with fixed price promotions
  const displayProducts = useMemo(() => {
    if (!activePromotions || !Array.isArray(activePromotions)) return [];
    
    // Filter for fixed price promotions and extract products
    const fixedPricePromotions = activePromotions.filter(promotion => {
      const isFixedPrice = promotion.type === 'fixed_price';
      const isActive = promotion.isActive !== false;
      
      // Check if promotion is connected to "fixed price" promotion list
      const hasFixedPriceList = promotion.promotionList && 
                               promotion.promotionList.name && 
                               promotion.promotionList.name.toLowerCase().includes('fixed price');
      
      return isFixedPrice && isActive;
    });
    
    // Convert promotions to product objects with promotion data
    const productsWithPromotions = [];
    
    // Group promotions by product to handle multiple units per product
    const productPromotionMap = new Map();
    
    fixedPricePromotions.forEach(promotion => {
      if (promotion.productUnit && promotion.productUnit.product) {
        const product = promotion.productUnit.product;
        const productId = product._id || product.id;
        
        if (!productPromotionMap.has(productId)) {
          productPromotionMap.set(productId, {
            product: product,
            promotions: []
          });
        }
        
        productPromotionMap.get(productId).promotions.push(promotion);
      }
    });
    
    // For each product, create a complete product object with all units
    productPromotionMap.forEach(({ product, promotions }) => {
      // Use the first promotion as the primary one
      const primaryPromotion = promotions[0];
      const promotionalUnit = primaryPromotion.productUnit;
      
      // Create a product object with embedded promotion data
      const productWithPromotion = {
        ...product,
        _id: product._id || product.id,
        title: product.title,
        slug: product.slug,
        image: product.image,
        price: promotionalUnit.price,
        hasMultiUnits: true,
        // Add promotion data for the ProductCardModern component
        promotion: {
          ...primaryPromotion,
          originalPrice: promotionalUnit.price,
          promotionalPrice: primaryPromotion.value,
          savings: promotionalUnit.price - primaryPromotion.value,
          savingsPercent: promotionalUnit.price > 0 ? ((promotionalUnit.price - primaryPromotion.value) / promotionalUnit.price) * 100 : 0,
          unit: promotionalUnit,
          productUnit: promotionalUnit
        }
        // Note: ProductCardModern will fetch all units for this product automatically
      };
      
      productsWithPromotions.push(productWithPromotion);
    });
    
    return productsWithPromotions.slice(0, maxItems);
  }, [activePromotions, maxItems]);

  // If query finished and we have no promotions, hide component completely
  if (!isLoading && (!activePromotions || activePromotions.length === 0)) {
    return null;
  }

  const pillText = `${displayProducts.length} ${tr('products with special prices','منتجات بسعر خاص')}`;

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 section-responsive"
    >
      <div className="max-w-screen-2xl mx-auto responsive-padding">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h2 className="heading-responsive text-gray-800 mb-2 sm:mb-3 flex items-center justify-center">
            <IoPricetagOutline className="text-blue-600 mr-2 sm:mr-3 text-responsive-lg" />
            {title}
          </h2>
          <p className="text-responsive-base text-gray-600 text-center max-w-xl mx-auto">{description}</p>
          
          {/* Show total savings if products available */}
          {displayProducts.length > 0 && (
            <div className="mt-3 sm:mt-4 inline-block bg-blue-100 text-blue-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-responsive-sm font-medium">
              {pillText}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <CMSkeleton count={8} height={250} error={error} loading={isLoading} />
        ) : displayProducts.length > 0 ? (
          <>
            {/* Product listing */}
            <ProductCardCarousel
              products={displayProducts}
              attributes={attributes || []}
              slidesPerViewMobile={1}
              fixedSlidesPerView={6}
            />
            
            {/* View More Button */}
            <div className="mt-6 sm:mt-8 md:mt-10 text-center">
              <Link 
                href="/promotions?tab=special-prices"
                className="btn-responsive inline-flex items-center bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
              >
                {tr('View All Special Prices','عرض جميع الأسعار الخاصة')}
                <IoArrowForward className="ml-2 text-responsive-xs" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-6 sm:py-8 md:py-10">
            <div className="text-responsive-lg text-gray-500 mb-3 sm:mb-4">{tr('No special price offers at the moment','لا توجد عروض أسعار خاصة في الوقت الحالي')}</div>
            <p className="text-responsive-base text-gray-400">{tr('Check back soon for amazing fixed price deals!','عد قريبًا للحصول على عروض أسعار ثابتة مذهلة!')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialPrices; 