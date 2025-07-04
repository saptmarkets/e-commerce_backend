import React from 'react';
import Link from 'next/link';
import { useQuery } from "@tanstack/react-query";
import { IoGiftOutline, IoArrowForward } from 'react-icons/io5';
import useTranslation from 'next-translate/useTranslation';

// Internal imports
import PromotionServices from "@services/PromotionServices";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const ComboDealsSimple = ({ 
  title = "Combo Deals", 
  description = "Mix and match deals - Get more for less!",
  maxItems = 3 
}) => {
  const { t } = useTranslation('common');
  const { showingTranslateValue, getNumberTwo } = useUtilsFunction();

  const { data: comboPromotions, error, isLoading } = useQuery({
    queryKey: ["assorted-promotions"],
    queryFn: async () => await PromotionServices.getAssortedPromotionsWithProducts(),
  });

  // Limit the number of promotions to display
  const displayPromotions = comboPromotions?.slice(0, maxItems) || [];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center">
            <IoGiftOutline className="text-purple-600 mr-3" />
            {title}
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
        </div>
        
        {isLoading ? (
          <CMSkeleton count={3} height={400} error={error} loading={isLoading} />
        ) : displayPromotions.length > 0 ? (
          <>
            {displayPromotions.map((promotion) => {
              const requiredCount = promotion.requiredItemCount || promotion.totalItems;
              
              return (
                <div key={promotion._id} className="mb-12 bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold flex items-center">
                          <IoGiftOutline className="mr-3" />
                          Get any {requiredCount} from following
                        </h3>
                        <p className="text-purple-100 mt-2">
                          {t('choose')} {requiredCount} {t('items')} for just ${getNumberTwo(promotion.value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">${getNumberTwo(promotion.value)}</div>
                        <div className="text-sm text-purple-200">
                          ${getNumberTwo(promotion.pricePerItem)} per item
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        This combo includes {promotion.products?.length || 0} products
                      </p>
                      <Link 
                        href="/promotions?tab=combo-deals"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition duration-200"
                      >
                        {t('viewDetails')}
                        <IoArrowForward className="ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* View More Button */}
            <div className="text-center">
              <Link 
                href="/promotions?tab=combo-deals"
                className="inline-flex items-center px-8 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition duration-200 shadow-md"
              >
                {t('viewAllComboDeals')}
                <IoArrowForward className="ml-2" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-500 text-lg mb-4">{t('noComboDealsAvailable')}</div>
            <p className="text-gray-400">{t('checkBackSoon')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboDealsSimple; 