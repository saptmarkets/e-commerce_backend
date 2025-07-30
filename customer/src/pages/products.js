import { useEffect, useState } from "react";
import Head from "next/head";
import Layout from "@layout/Layout";
import ProductCardModern from "@components/product/ProductCardModern";
import ProductServices from "@services/ProductServices";
import PromotionServices from "@services/PromotionServices";
import AttributeServices from "@services/AttributeServices";
import PageHeader from "@components/header/PageHeader";
import ProductsHeroBanner from "@components/banner/ProductsHeroBanner";
import useGetSetting from "@hooks/useGetSetting";
import CMSkeleton from "@components/preloader/CMSkeleton";
import Loading from "@components/preloader/Loading";
import { useRouter } from "next/router";
import useUtilsFunction from "@hooks/useUtilsFunction";

const AllProducts = ({ initialProducts, attributes }) => {
  const router = useRouter();
  const { storeCustomizationSetting } = useGetSetting();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 16; // Set to 16 as per user's observation
  const [totalProducts, setTotalProducts] = useState(0); // New state for total products
  const [hasUsedInitialProducts, setHasUsedInitialProducts] = useState(false); // Track if we've used initial products
  const { tr, lang } = useUtilsFunction();

  useEffect(() => {
    const fetchProducts = async () => {
      // Only use initialProducts on the very first load (page 1, no previous API calls)
      if (initialProducts && initialProducts.products && initialProducts.products.length > 0 && 
          !hasUsedInitialProducts && currentPage === 1) {
        setProducts(initialProducts.products);
        setTotalProducts(initialProducts.totalDoc);
        setHasUsedInitialProducts(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch products with pagination parameters
        const data = await ProductServices.getShowingStoreProducts({ page: currentPage, limit: productsPerPage });
        // API response received for page
        
        let productsData = [];
        let totalDocCount = 0;

        if (data && typeof data === 'object') {
          if (Array.isArray(data.products) && data.products.length > 0) {
            productsData = data.products;
          } else if (Array.isArray(data.popularProducts) && data.popularProducts.length > 0) {
            productsData = data.popularProducts;
          } else if (Array.isArray(data)) {
            productsData = data;
          }
          totalDocCount = data.totalDoc || productsData.length;
        }
        
        const activePromotions = await PromotionServices.getActivePromotions();
        console.log("Active promotions:", activePromotions);
        
        const productsWithPromotions = new Set();
        
        activePromotions.forEach(promotion => {
          if (promotion.productUnit && promotion.productUnit.product) {
            productsWithPromotions.add(promotion.productUnit.product._id);
          }
          if (promotion.productUnits && Array.isArray(promotion.productUnits)) {
            promotion.productUnits.forEach(productUnit => {
              if (productUnit.product) {
                productsWithPromotions.add(productUnit.product._id);
              }
            });
          }
        });
        
        console.log("Products with promotions:", Array.from(productsWithPromotions));
        
        const regularProducts = productsData.filter(product => 
          !productsWithPromotions.has(product._id)
        );
        
        console.log(`Found ${productsData.length} total products, ${regularProducts.length} regular products (excluding ${productsData.length - regularProducts.length} promotional products)`);
        
        setProducts(regularProducts);
        setTotalProducts(totalDocCount);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, productsPerPage, initialProducts, hasUsedInitialProducts]); // Include hasUsedInitialProducts in dependencies

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    router.push(`?page=${pageNumber}`, undefined, { shallow: true });
  };

  // Handle page query param if it exists on initial load
  useEffect(() => {
    if (router.query.page) {
      const pageNumber = parseInt(router.query.page);
      if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
      }
    }
  }, [router.query.page]);

  // Calculate pagination based on totalProducts
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const currentProductsDisplay = products; // products state now holds the current page's products

  return (
    <>
      <Head>
        <title>All Products</title>
        <meta name="description" content="All products on SaptMarkets" />
      </Head>

      <Layout>
        <div className="mx-auto max-w-screen-2xl px-4 py-2 sm:px-10">
          {/* Products Hero Banner */}
          <ProductsHeroBanner />
          
          <div className="flex flex-col">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                {tr("All Products", "جميع المنتجات")}
              </h1>
              <p className="text-gray-600 mb-4">
                {tr(
                  "Discover our complete collection of premium products",
                  "اكتشف مجموعتنا الكاملة من المنتجات المميزة"
                )}
              </p>
              <p className="text-sm text-gray-500">
                {lang === "ar"
                  ? `عرض ${totalProducts > 0 ? (currentPage - 1) * productsPerPage + 1 : 0}-${Math.min(currentPage * productsPerPage, totalProducts)} من ${totalProducts} منتج`
                  : `Showing ${totalProducts > 0 ? (currentPage - 1) * productsPerPage + 1 : 0}-${Math.min(currentPage * productsPerPage, totalProducts)} of ${totalProducts} products`
                }
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loading loading={true} size="xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 products-page-grid">
                {currentProductsDisplay && currentProductsDisplay.length > 0 ? (
                  currentProductsDisplay.map((product) => (
                    <ProductCardModern
                      key={product._id}
                      product={product}
                      attributes={attributes}
                      compact={false}
                      showQuantitySelector={true}
                      showFavorite={true}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-lg text-gray-500">No products found</p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l border ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-green-50'
                    }`}
                  >
                    {tr('Previous', 'السابق')}
                  </button>
                  
                  {/* Show limited page numbers with ellipsis for better UX */}
                  {[...Array(totalPages).keys()].map((number) => {
                    const pageNumber = number + 1;
                    // Show first page, last page, current page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-1 border-t border-b ${
                            pageNumber === currentPage
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-green-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    
                    // Add ellipsis
                    if (
                      (pageNumber === 2 && currentPage > 3) ||
                      (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return <span key={pageNumber} className="px-2 py-1 border-t border-b">...</span>;
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => 
                      paginate(currentPage < totalPages ? currentPage + 1 : totalPages)
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-r border ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-green-50'
                    }`}
                  >
                    {tr('Next', 'التالي')}
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { query } = context;
  const page = parseInt(query.page) || 1;
  const limit = 16; // Set to 16 for SSR initial load consistent with frontend
  try {
    console.log(`Fetching products in getServerSideProps for page ${page}, limit ${limit}`);
    const [productsDataResponse, attributes, activePromotions] = await Promise.all([
      ProductServices.getShowingStoreProducts({ page, limit }), // Pass page and limit here
      AttributeServices.getShowingAttributes(),
      PromotionServices.getActivePromotions(),
    ]);
    
    // Products API response (SSR) logged
    
    let products = [];
    let totalDoc = 0; // Initialize totalDoc
    
    if (productsDataResponse && typeof productsDataResponse === 'object') {
      if (Array.isArray(productsDataResponse.products) && productsDataResponse.products.length > 0) {
        products = productsDataResponse.products;
      } else if (Array.isArray(productsDataResponse.popularProducts) && productsDataResponse.popularProducts.length > 0) {
        products = productsDataResponse.popularProducts;
      } else if (Array.isArray(productsDataResponse)) {
        products = productsDataResponse;
      }
      totalDoc = productsDataResponse.totalDoc || products.length; // Capture totalDoc from response
    }
    
    const productsWithPromotions = new Set();
    
    if (activePromotions && Array.isArray(activePromotions)) {
      activePromotions.forEach(promotion => {
        if (promotion.productUnit && promotion.productUnit.product) {
          productsWithPromotions.add(promotion.productUnit.product._id);
        }
        if (promotion.productUnits && Array.isArray(promotion.productUnits)) {
          promotion.productUnits.forEach(productUnit => {
            if (productUnit.product) {
              productsWithPromotions.add(productUnit.product._id);
            }
          });
        }
      });
    }
    
    const regularProducts = products.filter(product => 
      !productsWithPromotions.has(product._id)
    );
    
    console.log(`Found ${products.length} total products from API, ${regularProducts.length} regular products (SSR)`);
    
    return {
      props: {
        initialProducts: {
          products: regularProducts || [],
          totalDoc: totalDoc, // Pass totalDoc to frontend
        },
        attributes: attributes || [],
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        initialProducts: { products: [], totalDoc: 0 },
        attributes: [],
      },
    };
  }
};

export default AllProducts; 