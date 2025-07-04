import React from 'react';
import Link from 'next/link';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/router';
import { IoGiftOutline, IoArrowForward } from 'react-icons/io5';

// Internal imports
import PromotionServices from "@services/PromotionServices";
import ComboOfferCard from "@components/product/ComboOfferCard";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const ComboDeals = ({ 
  title = "Combo Deals", 
  description = "Mix and match deals - Get more for less!",
  maxItems = 3 
}) => {
  const router = useRouter();
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  const { data: comboPromotions, error, isLoading } = useQuery({
    queryKey: ["assorted-promotions-with-products"],
    queryFn: async () => await PromotionServices.getAssortedPromotionsWithProducts(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Limit the number of promotions to display
  const displayPromotions = comboPromotions?.slice(0, maxItems) || [];

  // Hide entire section if there is no promotion after loading
  if (!isLoading && displayPromotions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center">
            <IoGiftOutline className="text-purple-600 mr-3" />
            {title}
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
          
          {/* Show total combo deals if available */}
          {displayPromotions.length > 0 && (
            <div className="mt-4 inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              {displayPromotions.length} combo deals available
            </div>
          )}
        </div>
        
        {isLoading ? (
          <CMSkeleton count={3} height={400} error={error} loading={isLoading} />
        ) : displayPromotions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayPromotions.map((promotion) => (
                <div key={promotion._id} className="transform scale-95">
                  <ComboOfferCard
                    promotion={promotion}
                  />
                </div>
              ))}
            </div>
            
            {/* View More Button */}
            <div className="mt-10 text-center">
              <Link 
                href="/promotions?tab=combo-deals"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 transition duration-200 shadow-md"
              >
                View All Combo Deals
                <IoArrowForward className="ml-2" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 text-lg mb-4">No combo deals available at the moment</div>
            <p className="text-gray-400">Check back soon for amazing mix and match offers!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboDeals; 