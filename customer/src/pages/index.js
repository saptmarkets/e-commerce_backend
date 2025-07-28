import { SidebarContext } from "@context/SidebarContext";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSessionstorage from "@rooks/use-sessionstorage";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";

//internal import
import Layout from "@layout/Layout";
import StickyCart from "@components/cart/StickyCart";
import Loading from "@components/preloader/Loading";
import ProductServices from "@services/ProductServices";
import AttributeServices from "@services/AttributeServices";
import PromotionServices from "@services/PromotionServices";
import useGetSetting from "@hooks/useGetSetting";

// Import the dynamic homepage component
import DynamicHomepage from "@components/homepage/DynamicHomepage";

const Home = () => {
  const router = useRouter();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const [value, set] = useSessionstorage("products", { products: [] });
  const { storeCustomizationSetting } = useGetSetting();
  const [imgLoading, setImgLoading] = useState(false);
  
  // Ensure value is properly initialized for session storage - moved here to avoid TDZ error
  const safeValue = value || { products: [] };

  // Optimized data fetching with React Query
  const {
    data: storeData,
    isLoading: storeDataLoading,
    error: storeDataError,
  } = useQuery({
    queryKey: ["homePageData"],
    queryFn: async () => await ProductServices.getShowingStoreProducts({}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const {
    data: attributes,
    isLoading: attributesLoading,
  } = useQuery({
    queryKey: ["attributes"],
    queryFn: async () => await AttributeServices.getShowingAttributes(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const {
    data: promotions,
    isLoading: promotionsLoading,
  } = useQuery({
    queryKey: ["activePromotions"],
    queryFn: async () => await PromotionServices.getActivePromotions(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Additional optimized product queries
  const {
    data: products,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", router.query.category],
    queryFn: async () => await ProductServices.getAllProducts(),
    enabled: !storeData?.products, // Only fetch if store data doesn't have products
    staleTime: 60000,
    cacheTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (router.asPath === "/") {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Ensure value exists and has products before setting
    if (safeValue?.products && Array.isArray(safeValue.products) && safeValue.products.length > 0) {
      set({ ...safeValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue]);

  useEffect(() => {
    if (router.query.category) {
      refetch();
    }
  }, [router.query.category, refetch]);

  useEffect(() => {
    const img = new Image();
    const imgUrl =
      storeCustomizationSetting?.home?.first_img ||
      "";
    img.src = imgUrl;

    const loadingTimeout = setTimeout(() => {
      setImgLoading(true);
    }, 1000);

    img.onload = () => {
      clearTimeout(loadingTimeout);
      setImgLoading(true);
    };

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [storeCustomizationSetting?.home?.first_img]);

  // Show loading state only for critical data
  const isPageLoading = storeDataLoading || !imgLoading;

  // Additional safety check for session storage hydration
  if (isPageLoading || typeof window === 'undefined') {
    return <Loading loading={true} />;
  }

  return (
    <>
      <Head>
        <title>
          {storeCustomizationSetting?.seo?.meta_title ||
            storeCustomizationSetting?.store?.name ||
            "SAPT Markets"}
        </title>
        <meta
          name="description"
          content={
            storeCustomizationSetting?.seo?.meta_description ||
            "SAPT Markets - Your trusted online grocery store in Saudi Arabia. Fresh products, fast delivery, and great prices."
          }
        />
        <meta
          name="keywords"
          content={
            storeCustomizationSetting?.seo?.meta_keywords ||
            "grocery, online shopping, Saudi Arabia, fresh food, delivery"
          }
        />
        <link rel="canonical" href="https://saptmarkets.com" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://saptmarkets.com/" />
        <meta
          property="og:title"
          content={
            storeCustomizationSetting?.seo?.og_title ||
            storeCustomizationSetting?.store?.name ||
            "SAPT Markets"
          }
        />
        <meta
          property="og:description"
          content={
            storeCustomizationSetting?.seo?.og_description ||
            "SAPT Markets - Your trusted online grocery store in Saudi Arabia"
          }
        />
        <meta
          property="og:image"
          content={
            storeCustomizationSetting?.seo?.og_image ||
            ""
          }
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://saptmarkets.com/" />
        <meta
          property="twitter:title"
          content={
            storeCustomizationSetting?.seo?.twitter_title ||
            storeCustomizationSetting?.store?.name ||
            "SAPT Markets"
          }
        />
        <meta
          property="twitter:description"
          content={
            storeCustomizationSetting?.seo?.twitter_description ||
            "SAPT Markets - Your trusted online grocery store in Saudi Arabia"
          }
        />
        <meta
          name="twitter:image"
          content={
            storeCustomizationSetting?.seo?.twitter_image ||
            ""
          }
        />
      </Head>

      <Layout>
        <div className="min-h-screen">
          <StickyCart />
          
          <div className="mx-auto">
            {/* Use Dynamic Homepage Component */}
            <DynamicHomepage />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
