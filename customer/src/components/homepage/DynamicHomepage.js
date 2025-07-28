import React from 'react';
import useHomepageSections from '@hooks/useHomepageSections';
import useGetSetting from '@hooks/useGetSetting';
import useUtilsFunction from '@hooks/useUtilsFunction';
import { useQuery } from '@tanstack/react-query';
import NeonSpinner from '@components/preloader/NeonSpinner';

// Import all section components
import MainCarousel from '@components/carousel/MainCarousel';
import DynamicSupermarketStats from '@components/common/DynamicSupermarketStats';
import CategorySection from '@components/category/CategorySection';
import SpecialPrices from '@components/offer/SpecialPrices';
import ComboDeals from '@components/offer/ComboDeals';
import FeaturedProducts from '@components/product/FeaturedProducts';
import BannerSection from '@components/banner/BannerSection';
import TrustFeatures from '@components/common/TrustFeatures';
import TestimonialsSection from '@components/common/TestimonialsSection';
import NewsletterSubscription from '@components/common/NewsletterSubscription';

// Import services for data
import ProductServices from '@services/ProductServices';
import AttributeServices from '@services/AttributeServices';
import PromotionServices from '@services/PromotionServices';

const DynamicHomepage = () => {
  const { sections, isLoading: sectionsLoading, isSectionActive, getSectionContent, getSectionSettings } = useHomepageSections();
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  // Fetch data for product sections
  const {
    data: storeData,
    isLoading: storeDataLoading,
  } = useQuery({
    queryKey: ["homePageData"],
    queryFn: async () => await ProductServices.getShowingStoreProducts({}),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: attributes,
  } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => await AttributeServices.getShowingAttributes(),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch active promotions once to build exclusion list for popular section
  const { data: activePromotions } = useQuery({
    queryKey: ["active-promotions-homepage"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const promoProductIdSet = React.useMemo(() => {
    const set = new Set();
    if (activePromotions && Array.isArray(activePromotions)) {
      activePromotions.forEach(promo => {
        if (promo.productUnit && promo.productUnit.product) {
          set.add(promo.productUnit.product._id || promo.productUnit.product.id);
        }
        if (promo.productUnits && promo.productUnits.length) {
          promo.productUnits.forEach(u => {
            if (u.product) set.add(u.product._id || u.product.id);
          });
        }
      });
    }
    return set;
  }, [activePromotions]);

  if (sectionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <NeonSpinner size="xl" />
      </div>
    );
  }

  // Extract data for product sections
  const popularProducts = storeData?.popularProducts || [];
  const discountedProducts = storeData?.discountedProducts || [];
  const storeProducts = storeData?.products || [];

  // Create section renderer function
  const renderSection = (section) => {
    if (!section.isActive) return null;

    const { sectionId, content, settings } = section;

    switch (sectionId) {
      case 'hero':
        return <MainCarousel key={sectionId} animationType="modern" />;

      case 'why_choose_us':
        return <DynamicSupermarketStats key={sectionId} />;

      case 'categories':
        return (
          <CategorySection 
            key={sectionId}
            title={showingTranslateValue(content?.title) || ''}
            description={showingTranslateValue(content?.description) || ''}
            categorySettings={settings}
          />
        );

      case 'special_prices':
        return (
          <SpecialPrices 
            key={sectionId}
            title={showingTranslateValue(content?.title) || "Special Prices"}
            description={showingTranslateValue(content?.description) || "Amazing fixed price deals on selected products"}
            maxItems={settings?.maxItems || 8}
            attributes={attributes || []}
          />
        );

      case 'combo_deals':
        return (
          <ComboDeals 
            key={sectionId}
            title={showingTranslateValue(content?.title) || "Combo Deals"}
            description={showingTranslateValue(content?.description) || "Mix and match deals - Get more for less!"}
            maxItems={settings?.maxItems || 3}
          />
        );

      case 'featured_products':
        return discountedProducts?.length > 0 || storeProducts?.length > 0 ? (
          <FeaturedProducts
            key={sectionId}
            products={discountedProducts?.length > 0 ? discountedProducts : storeProducts?.slice(0, settings?.maxItems || 50)}
            loading={storeDataLoading}
            attributes={attributes}
            title={showingTranslateValue(content?.title) || "Premium Selection"}
            description={showingTranslateValue(content?.description) || "Our featured products with improved shopping experience"}
            viewAllLink={content?.viewAllLink || "/products"}
            cardVariant={settings?.cardVariant || "simple"}
            gridCols={settings?.gridCols || "lg:grid-cols-5"}
            excludeProductIds={promoProductIdSet}
          />
        ) : null;

      case 'popular_products':
        return popularProducts?.length > 0 ? (
          <FeaturedProducts
            key={sectionId}
            products={popularProducts}
            loading={false}
            attributes={attributes}
            title={showingTranslateValue(content?.title) || "Popular Products"}
            description={showingTranslateValue(content?.description) || "Most popular products based on sales"}
            viewAllLink={content?.viewAllLink || "/products"}
            cardVariant={settings?.cardVariant || "simple"}
            gridCols={settings?.gridCols || "lg:grid-cols-5"}
            excludeProductIds={promoProductIdSet}
          />
        ) : null;

      case 'banner_section':
        return (
          <BannerSection 
            key={sectionId}
            title={showingTranslateValue(content?.title) || "Special Offers Just For You"}
            description={showingTranslateValue(content?.description) || "Discover amazing deals on our freshest products. Limited time offers available now!"}
            buttonText={showingTranslateValue(content?.buttonText) || "Shop Now"}
            buttonLink={content?.buttonLink || "/offer"}
          />
        );

      case 'discount_products':
        return discountedProducts?.length > 0 ? (
          <FeaturedProducts
            key={sectionId}
            products={discountedProducts}
            loading={false}
            attributes={attributes}
            title={showingTranslateValue(content?.title) || "Special Discounts"}
            description={showingTranslateValue(content?.description) || "Products with special discounts just for you"}
            viewAllLink={content?.viewAllLink || "/offer"}
            cardVariant={settings?.cardVariant || "simple"}
            gridCols={settings?.gridCols || "lg:grid-cols-5"}
            excludeProductIds={promoProductIdSet}
          />
        ) : null;

      case 'trust_features':
        return (
          <TrustFeatures 
            key={sectionId}
            title={showingTranslateValue(content?.title) || 'The SAPT Markets Advantage'}
            subtitle={content?.subtitle}
            description={showingTranslateValue(content?.description) || 'Experience the difference with our premium service standards'}
            features={content?.features || []}
          />
        );

      case 'testimonials':
        return (
          <TestimonialsSection 
            key={sectionId}
            title={showingTranslateValue(content?.title) || 'What Our Customers Say'}
            description={showingTranslateValue(content?.description) || 'Real reviews from satisfied shoppers across Saudi Arabia'}
            testimonials={content?.testimonials || []}
          />
        );

      case 'newsletter':
        return (
          <NewsletterSubscription 
            key={sectionId}
            title={showingTranslateValue(content?.title) || "Stay Updated"}
            description={showingTranslateValue(content?.description) || "Subscribe to our newsletter for the latest offers and updates"}
            buttonText={showingTranslateValue(content?.buttonText) || "Subscribe"}
            placeholderText={showingTranslateValue(content?.placeholderText) || "Enter your email address"}
            benefits={content?.benefits || []}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-4">
      {sections
        .filter(section => section.isActive) // Only render active sections
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(section => (
          <div key={section.sectionId}>
            {renderSection(section)}
          </div>
        ))
        .filter(Boolean)
      }
    </div>
  );
};

export default DynamicHomepage; 