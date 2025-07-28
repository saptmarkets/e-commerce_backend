import React, { useContext, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import useTranslation from "next-translate/useTranslation";
import { useQuery } from "@tanstack/react-query";

//internal import
import Layout from "@layout/Layout";
import useFilter from "@hooks/useFilter";
import Card from "@components/cta-card/Card";
import Loading from "@components/preloader/Loading";
import ProductServices from "@services/ProductServices";
import PromotionServices from "@services/PromotionServices";
import { SidebarContext } from "@context/SidebarContext";
import AttributeServices from "@services/AttributeServices";
import CategoryCarousel from "@components/carousel/CategoryCarousel";
import ProductCardModern from "@components/product/ProductCardModern";

const Search = ({ products, attributes, shouldRedirect, redirectTo }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const [visibleProduct, setVisibleProduct] = useState(18);

  // Fetch active promotions for search results
  const { data: activePromotions } = useQuery({
    queryKey: ["active-promotions-for-search"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
  });

  // Merge products with promotion data
  const productsWithPromotions = useMemo(() => {
    if (!products || !activePromotions) return products || [];
    
    console.log('Search: Merging products with promotions');
    console.log('Search: Products received:', products?.length);
    console.log('Search: Active promotions received:', activePromotions?.length);
    
    // Create a map of promotional units for quick lookup
    const promotionalUnitsMap = new Map();
    
    activePromotions.forEach(promotion => {
      if (promotion.type === 'fixed_price' && promotion.isActive !== false && promotion.productUnit) {
        const productId = promotion.productUnit.product?._id || promotion.productUnit.product?.id;
        if (productId) {
          if (!promotionalUnitsMap.has(productId)) {
            promotionalUnitsMap.set(productId, []);
          }
          promotionalUnitsMap.get(productId).push(promotion);
        }
      }
    });
    
    console.log('Search: Promotional units map:', promotionalUnitsMap.size, 'products with promotions');
    
    // Enhance products with promotion data
    const enhancedProducts = products.map(product => {
      const productId = product._id || product.id;
      const productPromotions = promotionalUnitsMap.get(productId);
      
      if (productPromotions && productPromotions.length > 0) {
        // Use the first promotion as the primary one
        const primaryPromotion = productPromotions[0];
        const promotionalUnit = primaryPromotion.productUnit;
        
        console.log('Search: Enhancing product with promotion:', {
          productId,
          productTitle: product.title,
          promotionValue: primaryPromotion.value,
          originalPrice: promotionalUnit.price
        });
        
        return {
          ...product,
          promotion: {
            ...primaryPromotion,
            originalPrice: promotionalUnit.price,
            promotionalPrice: primaryPromotion.value,
            savings: promotionalUnit.price - primaryPromotion.value,
            savingsPercent: promotionalUnit.price > 0 ? ((promotionalUnit.price - primaryPromotion.value) / promotionalUnit.price) * 100 : 0,
            unit: promotionalUnit,
            productUnit: promotionalUnit
          }
        };
      }
      
      return product;
    });
    
    console.log('Search: Enhanced products:', enhancedProducts.filter(p => p.promotion).length, 'with promotions');
    
    return enhancedProducts;
  }, [products, activePromotions]);

  useEffect(() => {
    setIsLoading(false);
    
    // Redirect old category search URLs to new category pages
    if (shouldRedirect && redirectTo) {
      router.replace(redirectTo);
      return;
    }
  }, [products, shouldRedirect, redirectTo, router]);

  const { setSortedField, productData } = useFilter(productsWithPromotions);

  // Show loading while redirecting
  if (shouldRedirect) {
    return (
      <Layout title="Redirecting..." description="Redirecting to category page">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
          <div className="flex py-10 lg:py-12 justify-center items-center">
            <Loading loading={true} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Search" description="This is search page">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex py-10 lg:py-12">
          <div className="flex w-full">
            <div className="w-full">
              {/* Search Results Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {router.query.query ? `Search Results for "${router.query.query}"` : 'Search Results'}
                </h1>
                <p className="text-gray-600">
                  {productData?.length > 0 
                    ? `Found ${productData.length} products` 
                    : 'No products found'
                  }
                </p>
              </div>
              {productData?.length === 0 ? (
                <div className="mx-auto p-5 my-5">
                  <Image
                    className="my-4 mx-auto"
                    src="/no-result.png"
                    alt="no-result"
                    width={400}
                    height={380}
                  />
                  <h2 className="text-lg md:text-xl lg:text-2xl xl:text-2xl text-center mt-2 font-medium font-serif text-gray-600">
                    {t("common:sorryText")} 😞
                  </h2>
                </div>
              ) : (
                <div className="flex justify-between my-3 bg-orange-100 border border-gray-100 rounded p-3">
                  <h6 className="text-sm font-serif">
                    {t("common:totalI")}{" "}
                    <span className="font-bold">{productData?.length}</span>{" "}
                    {t("common:itemsFound")}
                  </h6>
                  <span className="text-sm font-serif">
                    <select
                      onChange={(e) => setSortedField(e.target.value)}
                      className="py-0 text-sm font-serif font-medium block w-full rounded border-0 bg-white pr-10 cursor-pointer focus:ring-0"
                    >
                      <option className="px-3" value="All" defaultValue hidden>
                        {t("common:sortByPrice")}
                      </option>
                      <option className="px-3" value="Low">
                        {t("common:lowToHigh")}
                      </option>
                      <option className="px-3" value="High">
                        {t("common:highToLow")}
                      </option>
                    </select>
                  </span>
                </div>
              )}

              {isLoading ? (
                <Loading loading={isLoading} />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                    {productData?.slice(0, visibleProduct).map((product, i) => (
                      <ProductCardModern
                        key={i + 1}
                        product={product}
                        attributes={attributes}
                        compact={false}
                        showQuantitySelector={true}
                        showFavorite={true}
                        promotion={product.promotion}
                      />
                    ))}
                  </div>

                  {productData?.length > visibleProduct && (
                    <button
                      onClick={() => setVisibleProduct((pre) => pre + 10)}
                      className="w-auto mx-auto md:text-sm leading-5 flex items-center transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md focus-visible:outline-none focus:outline-none bg-indigo-100 text-gray-700 px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-emerald-600 h-12 mt-6 text-sm lg:text-sm"
                    >
                      {t("common:loadMoreBtn")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;

export const getServerSideProps = async (context) => {
  const { query, _id, category } = context.query;

  // If this is an old category search URL, redirect to new category page
  if (_id && category) {
    return {
      redirect: {
        destination: `/category/${_id}`,
        permanent: true,
      },
    };
  }

  // For regular search queries (not category-based), continue with normal search
  const [data, attributes] = await Promise.all([
    ProductServices.getShowingStoreProducts({
      category: _id || "",
      title: query || "",
    }),
    AttributeServices.getShowingAttributes({}),
  ]);

  return {
    props: {
      attributes,
      products: data?.products,
    },
  };
};
