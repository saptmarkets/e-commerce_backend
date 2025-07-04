import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from "@tanstack/react-query";
import { useRouter } from 'next/router';
import { IoTime } from 'react-icons/io5';

// Internal imports
import ProductServices from "@services/ProductServices";
import CMSkeleton from "@components/preloader/CMSkeleton";
import useUtilsFunction from "@hooks/useUtilsFunction";

const SpecialOffers = ({ title = "Exclusive Deals & Savings", description = "Limited-time offers on your favorite products — save more every day" }) => {
  const router = useRouter();
  const { showingTranslateValue } = useUtilsFunction();

  const { data, error, isLoading } = useQuery({
    queryKey: ["discounted-products"],
    queryFn: async () => await ProductServices.getDiscountedProducts(),
  });

  // Get top 3 products with highest discount
  const topDiscountedProducts = data?.products?.slice(0, 3) || [];

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">{title}</h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">{description}</p>
        </div>
        
        {isLoading ? (
          <CMSkeleton count={3} height={200} error={error} loading={isLoading} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topDiscountedProducts.map((product, index) => {
              // Calculate discount percentage
              const originalPrice = product.prices?.originalPrice || 0;
              const currentPrice = product.prices?.price || 0;
              const discountPercentage = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
              
              // Background colors for cards
              const bgColors = ["bg-primary", "bg-secondary", "bg-green-600"];
              
              return (
                <div 
                  key={product._id} 
                  className={`${bgColors[index % bgColors.length]} rounded-lg shadow-md relative overflow-hidden cursor-pointer`}
                  onClick={() => router.push(`/product/${product.slug}`)}
                >
                  {/* Timer badge */}
                  <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-full px-3 py-1 flex items-center z-10">
                    <IoTime className="text-red-500 mr-1" />
                    <span className="text-xs font-medium text-gray-800">Limited Time</span>
                  </div>
                  
                  <div className="p-6 md:p-8 flex justify-between items-center h-full">
                    <div className="z-10 relative">
                      <h3 className="text-xl font-bold mb-2 text-white">
                        {showingTranslateValue(product.title)}
                      </h3>
                      <div className="flex items-end mb-4">
                        <span className="text-4xl font-bold text-white">{discountPercentage}%</span>
                        <span className="ml-1 text-lg text-white opacity-90">OFF</span>
                      </div>
                      <div className="text-white text-sm mb-4">Save up to {discountPercentage}% on this product</div>
                      <Link 
                        href={`/product/${product.slug}`}
                        className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-md text-sm text-white hover:bg-opacity-30 transition duration-200"
                      >
                        Shop Now
                      </Link>
                    </div>
                    
                    <div className="absolute right-0 bottom-0 w-36 h-36 md:w-40 md:h-40 flex items-center justify-center">
                      {product.image && product.image[0] ? (
                        <div className="relative w-28 h-28 md:w-32 md:h-32">
                          <Image
                            src={product.image[0]}
                            alt={showingTranslateValue(product.title)}
                            fill
                            className="object-contain drop-shadow-lg"
                            sizes="(max-width: 768px) 112px, 128px"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link 
            href="/products?discount=true"
            className="px-8 py-3 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition duration-200 shadow-md inline-block"
          >
            View All Deals
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SpecialOffers; 