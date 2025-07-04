import { useEffect, useState } from "react";
import Head from "next/head";
import Layout from "@layout/Layout";
import ProductCardModern from "@components/product/ProductCardModern";
import ProductServices from "@services/ProductServices";
import AttributeServices from "@services/AttributeServices";
import PageHeader from "@components/header/PageHeader";
import ProductsHeroBanner from "@components/banner/ProductsHeroBanner";
import useGetSetting from "@hooks/useGetSetting";
import CMSkeleton from "@components/preloader/CMSkeleton";
import Loading from "@components/preloader/Loading";
import { useRouter } from "next/router";

const AllProducts = ({ initialProducts, attributes }) => {
  const router = useRouter();
  const { storeCustomizationSetting } = useGetSetting();
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 24; // Show more products per page

  useEffect(() => {
    const fetchProducts = async () => {
      if (initialProducts && initialProducts.length > 0) {
        setProducts(initialProducts);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await ProductServices.getShowingStoreProducts({});
        console.log("API response:", data); // Log the response to see its structure
        
        // Check for products from various properties of the response
        let productsData = [];
        
        if (data && typeof data === 'object') {
          // Check for products array
          if (Array.isArray(data.products) && data.products.length > 0) {
            productsData = data.products;
          } 
          // If no direct products, check for popularProducts
          else if (Array.isArray(data.popularProducts) && data.popularProducts.length > 0) {
            productsData = data.popularProducts;
          }
          // If data itself is an array, use it directly
          else if (Array.isArray(data)) {
            productsData = data;
          }
        }
        
        console.log(`Found ${productsData.length} products to display`);
        setProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialProducts]);

  // Handle page query param if it exists
  useEffect(() => {
    if (router.query.page) {
      const pageNumber = parseInt(router.query.page);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setCurrentPage(pageNumber);
      }
    }
  }, [router.query.page]);

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    
    // Update URL with page number
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: pageNumber },
    }, undefined, { shallow: true });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>All Products | {storeCustomizationSetting?.store?.name || "SAPT Markets"}</title>
        <meta 
          name="description" 
          content="Browse our complete collection of products. Find everything you need in one place."
        />
      </Head>

      <Layout>
        <div className="mx-auto max-w-screen-2xl px-4 py-2 sm:px-10">
          {/* Products Hero Banner */}
          <ProductsHeroBanner />
          
          <div className="flex flex-col">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                All Products
              </h1>
              <p className="text-gray-600 mb-4">
                Discover our complete collection of premium products
              </p>
              <p className="text-sm text-gray-500">
                Showing {products.length > 0 ? indexOfFirstProduct + 1 : 0}-
                {Math.min(indexOfLastProduct, products.length)} of {products.length} products
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loading loading={true} size="xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {currentProducts && currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
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
                    Previous
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
                            currentPage === pageNumber
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
                    Next
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

export const getServerSideProps = async () => {
  try {
    console.log("Fetching products in getServerSideProps");
    const [productsData, attributes] = await Promise.all([
      ProductServices.getShowingStoreProducts({}),
      AttributeServices.getShowingAttributes(),
    ]);
    
    console.log("Products API response:", JSON.stringify(productsData).substring(0, 200) + "...");
    
    // Extract products from the response with better fallbacks
    let products = [];
    
    if (productsData && typeof productsData === 'object') {
      // First try products array
      if (Array.isArray(productsData.products) && productsData.products.length > 0) {
        products = productsData.products;
      } 
      // Then try popularProducts array
      else if (Array.isArray(productsData.popularProducts) && productsData.popularProducts.length > 0) {
        products = productsData.popularProducts;
      }
      // If productsData itself is an array, use it directly
      else if (Array.isArray(productsData)) {
        products = productsData;
      }
    }
    
    console.log(`Found ${products.length} products to return from server props`);
    
    return {
      props: {
        initialProducts: products || [],
        attributes: attributes || [],
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        initialProducts: [],
        attributes: [],
      },
    };
  }
};

export default AllProducts; 