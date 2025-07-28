import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoFlashOutline, IoArrowForward } from 'react-icons/io5';

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
  const [comboPromotions, setComboPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tr } = useUtilsFunction();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        
        // Use the EXACT same approach as promotions page
        const [bulk, assorted] = await Promise.all([
          PromotionServices.getBulkPromotions(),
          PromotionServices.getAssortedPromotionsWithProducts()
        ]);
        
        // Combo deals are the same as assorted items promotions with products
        const comboDeals = assorted;
        
        // Limit the number of promotions to display
        const displayPromotions = comboDeals?.slice(0, maxItems) || [];
        setComboPromotions(displayPromotions);
        
      } catch (error) {
        console.error("Error fetching promotions for homepage:", error);
        setComboPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [maxItems]);

  // Hide entire section if there is no promotion after loading
  if (!loading && comboPromotions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center">
            <IoFlashOutline className="text-purple-600 mr-3" />
            {title}
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
          
          {/* Show total combo deals if available */}
          {comboPromotions.length > 0 && (
            <div className="mt-4 inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              {comboPromotions.length} {tr('combo deals available','عروض باقات متاحة')}
            </div>
          )}
        </div>
        
        {loading ? (
          <CMSkeleton count={3} height={400} loading={loading} />
        ) : comboPromotions.length > 0 ? (
          <>
            {/* Responsive Grid Layout - Vertical on mobile, Horizontal on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 md:gap-1 lg:gap-1">
              {comboPromotions.map((promotion) => (
                <ComboOfferCard
                  key={promotion._id}
                  promotion={promotion}
                />
              ))}
            </div>
            
            {/* View More Button */}
            <div className="mt-8 md:mt-10 text-center">
              <Link 
                href="/promotions?tab=combo-deals"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 transition duration-200 shadow-md"
              >
                {tr('View All Combo Deals','عرض جميع عروض الباقات')}
                <IoArrowForward className="ml-2" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <div className="text-lg text-gray-500 mb-4">{tr('No combo deals available at the moment','لا توجد عروض باقات متاحة في الوقت الحالي')}</div>
            <p className="text-gray-400">{tr('Check back soon for amazing mix and match offers!','عد قريبًا للحصول على عروض خلط ومطابقة مذهلة!')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboDeals; 