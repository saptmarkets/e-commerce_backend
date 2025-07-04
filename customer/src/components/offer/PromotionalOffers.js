import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/router';
import { IoTime, IoGift, IoPricetag } from 'react-icons/io5';

// Internal imports
import PromotionServices from "@services/PromotionServices";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const PromotionalOffers = ({ 
  title = "Special Promotions", 
  description = "Amazing deals and offers just for you",
  maxItems = 6 
}) => {
  const router = useRouter();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  const { data: promotions, error, isLoading } = useQuery({
    queryKey: ["active-promotions"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
  });

  // Filter and prepare promotions for display
  const displayPromotions = promotions?.slice(0, maxItems) || [];

  const getPromotionIcon = (type) => {
    switch (type) {
      case 'fixed_price':
        return <IoPricetag className="w-5 h-5" />;
      case 'bulk_purchase':
        return <IoGift className="w-5 h-5" />;
      case 'assorted_items':
        return <IoGift className="w-5 h-5" />;
      default:
        return <IoTime className="w-5 h-5" />;
    }
  };

  const getPromotionBadge = (promotion) => {
    switch (promotion.type) {
      case 'fixed_price':
        return `Special Price $${getNumberTwo(promotion.value)}`;
      case 'bulk_purchase':
        return `Buy ${promotion.requiredQty} Get ${promotion.freeQty} Free`;
      case 'assorted_items':
        return `${promotion.items?.length || 0} Items for $${getNumberTwo(promotion.value)}`;
      default:
        return 'Special Offer';
    }
  };

  const getPromotionDescription = (promotion) => {
    switch (promotion.type) {
      case 'fixed_price':
        return `Get this product at a special fixed price of $${getNumberTwo(promotion.value)}`;
      case 'bulk_purchase':
        return `Buy ${promotion.requiredQty} items and get ${promotion.freeQty} absolutely free!`;
      case 'assorted_items':
        return `Get ${promotion.items?.length || 0} selected items for just $${getNumberTwo(promotion.value)}`;
      default:
        return 'Limited time special offer';
    }
  };

  const handlePromotionClick = (promotion) => {
    if (promotion.type === 'assorted_items') {
      router.push('/promotions');
    } else if (promotion.product?.slug) {
      router.push(`/product/${promotion.product.slug}`);
    } else {
      router.push('/promotions');
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">{title}</h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
        </div>
        
        {isLoading ? (
          <CMSkeleton count={6} height={200} error={error} loading={isLoading} />
        ) : displayPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPromotions.map((promotion, index) => {
              // Background colors for different promotion types
              const bgColors = {
                'fixed_price': 'bg-gradient-to-br from-blue-500 to-blue-600',
                'bulk_purchase': 'bg-gradient-to-br from-green-500 to-green-600',
                'assorted_items': 'bg-gradient-to-br from-purple-500 to-purple-600'
              };
              
              const bgColor = bgColors[promotion.type] || 'bg-gradient-to-br from-red-500 to-red-600';
              
              return (
                <div 
                  key={promotion._id} 
                  className={`${bgColor} rounded-lg shadow-lg relative overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300`}
                  onClick={() => handlePromotionClick(promotion)}
                >
                  {/* Status badge */}
                  <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-full px-3 py-1 flex items-center z-10">
                    {getPromotionIcon(promotion.type)}
                    <span className="text-xs font-medium text-gray-800 ml-1">
                      {promotion.status === 'active' ? 'Active' : 'Limited Time'}
                    </span>
                  </div>
                  
                  <div className="p-6 md:p-8 h-full flex flex-col justify-between">
                    <div className="z-10 relative">
                      <h3 className="text-xl font-bold mb-2 text-white">
                        {promotion.product ? 
                          showingTranslateValue(promotion.product.title) : 
                          promotion.title || 'Special Promotion'
                        }
                      </h3>
                      
                      <div className="mb-4">
                        <div className="inline-block bg-white bg-opacity-20 rounded-md px-3 py-1 text-sm text-white font-medium">
                          {getPromotionBadge(promotion)}
                        </div>
                      </div>
                      
                      <div className="text-white text-sm mb-4 opacity-90">
                        {getPromotionDescription(promotion)}
                      </div>
                      
                      {promotion.endDate && (
                        <div className="text-white text-xs mb-4 opacity-75">
                          Valid until: {new Date(promotion.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Product image for single product promotions */}
                    {promotion.product?.image?.[0] && (
                      <div className="absolute right-4 bottom-4 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          <Image
                            src={promotion.product.image[0]}
                            alt={showingTranslateValue(promotion.product.title)}
                            fill
                            className="object-contain drop-shadow-lg"
                            sizes="(max-width: 768px) 80px, 96px"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button className="w-full px-4 py-2 bg-white bg-opacity-20 rounded-md text-sm text-white hover:bg-opacity-30 transition duration-200 font-medium">
                        {promotion.type === 'assorted_items' ? 'View Combo' : 'Shop Now'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -mr-8 -mt-8"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-white bg-opacity-10 rounded-full -ml-6 -mb-6"></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 text-lg mb-4">No active promotions at the moment</div>
            <p className="text-gray-400">Check back soon for amazing deals!</p>
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link 
            href="/promotions"
            className="px-8 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition duration-200 shadow-md inline-block"
          >
            View All Promotions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PromotionalOffers; 