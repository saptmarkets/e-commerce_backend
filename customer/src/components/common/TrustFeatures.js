import React from 'react';
import { FaTruck, FaShieldAlt, FaHeadset, FaCheckCircle, FaTrophy, FaMobile } from 'react-icons/fa';
import useUtilsFunction from '@hooks/useUtilsFunction';

const TrustFeatures = ({ title, description, features: propFeatures }) => {
  const { showingTranslateValue } = useUtilsFunction();

  const defaultFeatures = [
    {
      icon: <FaTruck className="text-3xl text-green-600" />,
      title: { en: "Free Same-Day Delivery", ar: "توصيل مجاني في نفس اليوم" },
      description: { en: "Order by 2 PM for same-day delivery — no minimum purchase required", ar: "اطلب قبل الساعة 2 ظهراً للحصول على التوصيل في نفس اليوم - لا يوجد حد أدنى للشراء" }
    },
    {
      icon: <FaShieldAlt className="text-3xl text-blue-600" />,
      title: { en: "Secure Payment Gateway", ar: "بوابة دفع آمنة" },
      description: { en: "Your financial information is protected with bank-grade encryption", ar: "معلوماتك المالية محمية بتشفير بمستوى البنوك" }
    },
    {
      icon: <FaHeadset className="text-3xl text-purple-600" />,
      title: { en: "Expert Customer Support", ar: "دعم عملاء خبير" },
      description: { en: "Reach our knowledgeable team via chat, phone, or email — 24/7", ar: "تواصل مع فريقنا الخبير عبر الدردشة أو الهاتف أو البريد الإلكتروني - 24/7" }
    },
    {
      icon: <FaCheckCircle className="text-3xl text-green-600" />,
      title: { en: "Freshness Guarantee", ar: "ضمان الطزاجة" },
      description: { en: "100% satisfaction promise — fresh products or full refund", ar: "وعد رضا 100% - منتجات طازجة أو استرداد كامل" }
    },
    {
      icon: <FaTrophy className="text-3xl text-yellow-600" />,
      title: { en: "Premium Quality Standards", ar: "معايير جودة متميزة" },
      description: { en: "Rigorous quality checks ensure only the best products reach you", ar: "فحوصات جودة صارمة تضمن وصول أفضل المنتجات إليك" }
    },
    {
      icon: <FaMobile className="text-3xl text-indigo-600" />,
      title: { en: "User-Friendly Shopping", ar: "تسوق سهل الاستخدام" },
      description: { en: "Intuitive interface designed for effortless browsing and purchasing", ar: "واجهة بديهية مصممة للتصفح والشراء بسهولة" }
    }
  ];

  // Use prop features if available, otherwise use default features
  const features = propFeatures && propFeatures.length > 0 ? propFeatures : defaultFeatures;

  const getFeatureIcon = (index) => {
    const iconMap = [
      <FaTruck className="text-2xl sm:text-3xl text-green-600" />,
      <FaShieldAlt className="text-2xl sm:text-3xl text-blue-600" />,
      <FaHeadset className="text-2xl sm:text-3xl text-purple-600" />,
      <FaCheckCircle className="text-2xl sm:text-3xl text-green-600" />,
      <FaTrophy className="text-2xl sm:text-3xl text-yellow-600" />,
      <FaMobile className="text-2xl sm:text-3xl text-indigo-600" />
    ];
    return iconMap[index % iconMap.length];
  };

  return (
    <div className="bg-white py-8 sm:py-10 md:py-12 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-10">
        <div className="mb-6 sm:mb-8 md:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3 brand-name-arabic font-noor">
            {typeof title === 'string' ? title : showingTranslateValue(title) || 'The SAPT Markets Advantage'}
          </h2>
          {typeof subtitle !== 'undefined' && (
            <div className="text-lg sm:text-xl font-semibold text-gray-700 mb-1 sm:mb-2 font-noor">
              {typeof subtitle === 'string' ? subtitle : showingTranslateValue(subtitle)}
            </div>
          )}
          <p className="text-gray-600 text-center max-w-xl mx-auto text-sm sm:text-base font-noor">
            {typeof description === 'string' ? description : showingTranslateValue(description) || 'Experience the difference with our premium service standards'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                  <div className="text-2xl sm:text-3xl">
                    {feature.icon || getFeatureIcon(index)}
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2 font-noor">
                    {typeof feature.title === 'string' ? feature.title : showingTranslateValue(feature.title)}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base font-noor">
                    {typeof feature.description === 'string' ? feature.description : showingTranslateValue(feature.description)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustFeatures; 