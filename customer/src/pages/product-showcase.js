import Head from "next/head";
import Layout from "@layout/Layout";
import ProductCardAdvanced from "@components/product/ProductCardAdvanced";
import ProductCardSimple from "@components/product/ProductCardSimple";
import SpecialOfferCardAdvanced from "@components/product/SpecialOfferCardAdvanced";

const ProductShowcase = () => {
  // Sample product data for demonstration
  const sampleProduct = {
    _id: "sample_product_1",
    title: {
      en: "Coca-Cola Classic Soft Drink",
      ar: "كوكا كولا كلاسيك"
    },
    description: {
      en: "The original taste of Coca-Cola, refreshing and delicious. Perfect for any occasion, served ice cold for maximum enjoyment.",
      ar: "الطعم الأصلي لكوكا كولا، منعش ولذيذ"
    },
    image: [
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500",
      "https://images.unsplash.com/photo-1629203849349-61d32efe6239?w=500",
      "https://images.unsplash.com/photo-1525395089-7f20284bd0d5?w=500"
    ],
    price: 15.99,
    originalPrice: 18.99,
    stock: 150,
    rating: 4.5,
    reviewCount: 245,
    category: "Beverages",
    sku: "COCA-COLA-CLASSIC",
    unit: "bottle",
    discount: 15,
    ingredients: "Carbonated water, sugar, caramel color, phosphoric acid, natural flavors, caffeine",
    nutritionalInfo: "140 calories per 12 fl oz serving"
  };

  // Sample promotion data
  const samplePromotion = {
    _id: "promo_1",
    type: "bulk_purchase",
    requiredQty: 2,
    freeQty: 1,
    value: 25.99,
    minQty: 2,
    maxQty: 10,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  };

  const sampleAttributes = {};

  return (
    <>
      <Head>
        <title>Product Card Showcase - SAPT Markets</title>
        <meta name="description" content="Showcase of different product card designs and features" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 py-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Product Card Showcase
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover our new advanced product cards with enhanced features including 
                multiple units, dynamic pricing, image galleries, and promotional offers.
              </p>
            </div>

            {/* Advanced Product Card Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Advanced Product Card
                </h2>
                <p className="text-gray-600 mb-6">
                  Features: Multiple images, unit variations, dynamic pricing, quantity selector, 
                  ratings, specifications, wishlist, and share functionality - inspired by premium e-commerce experiences.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                <ProductCardAdvanced 
                  product={sampleProduct}
                  attributes={sampleAttributes}
                />
                <ProductCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_2",
                    title: { en: "Premium Orange Juice", ar: "عصير برتقال مميز" },
                    price: 8.99,
                    originalPrice: 10.99,
                    rating: 4.8,
                    reviewCount: 189
                  }}
                  attributes={sampleAttributes}
                />
                <ProductCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_3",
                    title: { en: "Mineral Water 6-Pack", ar: "مياه معدنية 6 قطع" },
                    price: 12.99,
                    rating: 4.3,
                    reviewCount: 156
                  }}
                  attributes={sampleAttributes}
                />
              </div>
            </section>

            {/* Enhanced Product Card Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Enhanced Product Card
                </h2>
                <p className="text-gray-600 mb-6">
                  Features: Multi-unit support, promotions integration, improved layout, 
                  and better user experience - perfect for products with multiple sizes and promotions.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <ProductCardEnhanced 
                  product={sampleProduct}
                  attributes={sampleAttributes}
                />
                <ProductCardEnhanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_4",
                    title: { en: "Energy Drink", ar: "مشروب طاقة" },
                    price: 4.99,
                    rating: 4.1
                  }}
                  attributes={sampleAttributes}
                />
                <ProductCardEnhanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_5",
                    title: { en: "Sports Drink", ar: "مشروب رياضي" },
                    price: 3.99,
                    rating: 4.4
                  }}
                  attributes={sampleAttributes}
                />
                <ProductCardEnhanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_6",
                    title: { en: "Fruit Juice", ar: "عصير فواكه" },
                    price: 6.99,
                    rating: 4.6
                  }}
                  attributes={sampleAttributes}
                />
              </div>
            </section>

            {/* Special Offer Cards Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Special Offer Cards
                </h2>
                <p className="text-gray-600 mb-6">
                  Features: Promotional pricing, countdown timers, bulk deals, savings calculations, 
                  and attractive promotional design - perfect for special offers and limited-time deals.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <SpecialOfferCardAdvanced 
                  product={sampleProduct}
                  promotion={samplePromotion}
                  attributes={sampleAttributes}
                  variant="default"
                />
                <SpecialOfferCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_7",
                    title: { en: "Mixed Beverage Bundle", ar: "باقة مشروبات مختلطة" },
                    price: 45.99,
                    originalPrice: 59.99
                  }}
                  promotion={{
                    ...samplePromotion,
                    _id: "promo_2",
                    type: "fixed_price",
                    value: 39.99
                  }}
                  attributes={sampleAttributes}
                  variant="default"
                />
              </div>
            </section>

            {/* Compact Offer Cards Section */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Compact Offer Cards
                </h2>
                <p className="text-gray-600 mb-6">
                  Compact version of special offer cards - perfect for smaller spaces and grid layouts.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <SpecialOfferCardAdvanced 
                  product={sampleProduct}
                  promotion={samplePromotion}
                  attributes={sampleAttributes}
                  variant="compact"
                />
                <SpecialOfferCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_8",
                    title: { en: "Tea Collection", ar: "مجموعة شاي" },
                    price: 19.99,
                    originalPrice: 24.99
                  }}
                  promotion={{
                    ...samplePromotion,
                    _id: "promo_3",
                    type: "fixed_price",
                    value: 16.99
                  }}
                  attributes={sampleAttributes}
                  variant="compact"
                />
                <SpecialOfferCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_9",
                    title: { en: "Coffee Beans", ar: "حبوب قهوة" },
                    price: 29.99,
                    originalPrice: 34.99
                  }}
                  promotion={{
                    ...samplePromotion,
                    _id: "promo_4",
                    type: "fixed_price",
                    value: 24.99
                  }}
                  attributes={sampleAttributes}
                  variant="compact"
                />
                <SpecialOfferCardAdvanced 
                  product={{
                    ...sampleProduct,
                    _id: "sample_product_10",
                    title: { en: "Snack Mix", ar: "خليط وجبات خفيفة" },
                    price: 14.99,
                    originalPrice: 17.99
                  }}
                  promotion={{
                    ...samplePromotion,
                    _id: "promo_5",
                    type: "fixed_price",
                    value: 12.99
                  }}
                  attributes={sampleAttributes}
                  variant="compact"
                />
              </div>
            </section>

            {/* Feature Comparison */}
            <section className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Feature Comparison
                </h2>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Feature</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Enhanced</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Advanced</th>
                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Special Offers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Multiple Images Gallery</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Multi-Unit Support</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">❌</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Dynamic Pricing</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Promotions Integration</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Quantity Selector</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Wishlist & Share</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">❌</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Product Specifications</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">❌</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Countdown Timer</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">❌</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Savings Calculator</td>
                        <td className="px-6 py-4 text-center">Basic</td>
                        <td className="px-6 py-4 text-center">✅</td>
                        <td className="px-6 py-4 text-center">✅</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 text-white">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Experience the Difference?
                </h2>
                <p className="text-lg mb-6 opacity-90">
                  These enhanced product cards are now live on your website, providing customers 
                  with a premium shopping experience similar to top e-commerce platforms.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/"
                    className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    View Homepage
                  </a>
                  <a
                    href="/products"
                    className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
                  >
                    Browse Products
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProductShowcase; 