import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/router';
import { IoPricetagOutline, IoArrowForward } from 'react-icons/io5';

// Internal imports
import PromotionServices from "@services/PromotionServices";
import ProductUnitServices from "@services/ProductUnitServices";
import ProductCardModern from "@components/product/ProductCardModern";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const SpecialPrices = ({ 
  title = "Special Prices", 
  description = "Amazing fixed price deals on selected products",
  maxItems = 8,
  attributes
}) => {
  const router = useRouter();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  // Fetch active promotions instead of general products
  const { data: activePromotions, error, isLoading } = useQuery({
    queryKey: ["active-promotions-for-special-offers"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
  });

  // Filter and prepare products with fixed price promotions
  const displayProducts = useMemo(() => {
    if (!activePromotions || !Array.isArray(activePromotions)) return [];
    
    console.log('SpecialPrices: Active promotions received:', activePromotions);
    
    // Filter for fixed price promotions and extract products
    const fixedPricePromotions = activePromotions.filter(promotion => {
      const isFixedPrice = promotion.type === 'fixed_price';
      const isActive = promotion.isActive !== false;
      
      // Check if promotion is connected to "fixed price" promotion list
      const hasFixedPriceList = promotion.promotionList && 
                               promotion.promotionList.name && 
                               promotion.promotionList.name.toLowerCase().includes('fixed price');
      
      console.log(`SpecialPrices: Checking promotion ${promotion._id}:`, {
        type: promotion.type,
        isFixedPrice,
        isActive,
        promotionListName: promotion.promotionList?.name,
        hasFixedPriceList,
        hasProductUnit: !!promotion.productUnit,
        productUnitDetails: promotion.productUnit
      });
      
      return isFixedPrice && isActive;
    });
    
    console.log('SpecialPrices: Fixed price promotions found:', fixedPricePromotions.length);
    
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
      
      console.log('SpecialPrices: Added product with promotion:', {
        productId: product._id,
        productTitle: product.title,
        originalPrice: promotionalUnit.price,
        promotionalPrice: primaryPromotion.value,
        savings: promotionalUnit.price - primaryPromotion.value,
        promotionsCount: promotions.length
      });
    });
    
    console.log('SpecialPrices: Final products with promotions:', productsWithPromotions.length);
    
    return productsWithPromotions.slice(0, maxItems);
  }, [activePromotions, maxItems]);

  // If query finished and we have no promotions, hide component completely
  if (!isLoading && (!activePromotions || activePromotions.length === 0)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center">
            <IoPricetagOutline className="text-blue-600 mr-3" />
            {title}
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
          
          {/* Show total savings if products available */}
          {displayProducts.length > 0 && (
            <div className="mt-4 inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              {displayProducts.length} products with special prices
            </div>
          )}
        </div>
        
        {isLoading ? (
          <CMSkeleton count={8} height={300} error={error} loading={isLoading} />
        ) : displayProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {displayProducts.map((product) => {
                console.log('SpecialPrices: Rendering ProductCardModern with product:', {
                  id: product._id,
                  title: product.title,
                  hasPromotion: !!product.promotion,
                  promotionValue: product.promotion?.value
                });
                return (
                  <ProductCardModern
                    key={product._id}
                    product={product}
                    attributes={attributes || []}
                    compact={false}
                    showQuantitySelector={true}
                    showFavorite={true}
                    promotion={product.promotion}
                  />
                );
              })}
            </div>
            
            {/* View More Button */}
            <div className="mt-10 text-center">
              <Link 
                href="/promotions?tab=special-prices"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
              >
                View All Special Prices
                <IoArrowForward className="ml-2" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 text-lg mb-4">No special price offers at the moment</div>
            <p className="text-gray-400">Check back soon for amazing fixed price deals!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialPrices; 