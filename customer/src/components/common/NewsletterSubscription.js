import React, { useState } from 'react';
import { FaRegEnvelope, FaCheckCircle, FaTag, FaRegClock, FaBell, FaUserCheck } from 'react-icons/fa';
import useUtilsFunction from '@hooks/useUtilsFunction';

const NewsletterSubscription = ({ title, description, buttonText, placeholderText, benefits: propBenefits }) => {
  const { showingTranslateValue, tr } = useUtilsFunction();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError(tr('Please enter your email address', 'يرجى إدخال بريدك الإلكتروني'));
      return;
    }
    if (!agreed) {
      setError(tr('Please agree to receive promotional emails', 'يرجى الموافقة على استلام الرسائل الترويجية'));
      return;
    }
    
    // Here you would handle the actual subscription logic
    // For now, we'll just simulate success
    setSubmitted(true);
    setError('');
  };

  const defaultBenefits = [
    {
      icon: <FaTag className="text-green-600" />,
      text: { en: "Weekly exclusive discount codes", ar: "رموز خصم حصرية أسبوعية" },
      iconType: "tag"
    },
    {
      icon: <FaRegClock className="text-blue-600" />,
      text: { en: "Early access to seasonal sales", ar: "وصول مبكر للمبيعات الموسمية" },
      iconType: "clock"
    },
    {
      icon: <FaBell className="text-orange-500" />,
      text: { en: "New product launch notifications", ar: "إشعارات إطلاق منتجات جديدة" },
      iconType: "bell"
    },
    {
      icon: <FaUserCheck className="text-purple-600" />,
      text: { en: "Personalized recommendations", ar: "توصيات شخصية" },
      iconType: "user"
    }
  ];

  // Use prop benefits if available, otherwise use default benefits
  const benefits = propBenefits && propBenefits.length > 0 ? propBenefits : defaultBenefits;

  const getIconByType = (iconType) => {
    switch (iconType) {
      case 'tag':
        return <FaTag className="text-green-600" />;
      case 'clock':
        return <FaRegClock className="text-blue-600" />;
      case 'bell':
        return <FaBell className="text-orange-500" />;
      case 'user':
        return <FaUserCheck className="text-purple-600" />;
      default:
        return <FaTag className="text-green-600" />;
    }
  };

  return (
    <div className="bg-gray-50 py-8 sm:py-10 md:py-12 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-10">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-3 sm:p-4 md:p-6 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 brand-name-arabic">
                {title || tr('Stay Connected with SAPT Markets', 'ابقَ على اتصال مع أسواق سبت')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 md:mb-6">
                {description || tr('Join over 50,000 satisfied customers who receive exclusive deals, seasonal offers, and insider updates', 'انضم إلى أكثر من 50,000 عميل راضٍ يتلقون عروضًا حصرية وتحديثات موسمية')}
              </p>
              
              <ul className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 md:mb-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-2 sm:space-x-3">
                    <span className="flex-shrink-0 text-sm sm:text-base">
                      {benefit.icon || getIconByType(benefit.iconType)}
                    </span>
                    <span className="text-gray-700 text-xs sm:text-sm md:text-base">
                      {typeof benefit.text === 'string' ? benefit.text : showingTranslateValue(benefit.text)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm">
              {submitted ? (
                <div className="text-center py-4 sm:py-6 md:py-8">
                  <FaCheckCircle className="text-green-500 text-2xl sm:text-3xl md:text-4xl lg:text-5xl mx-auto mb-2 sm:mb-3 md:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">{tr('Successfully Subscribed!', 'تم الاشتراك بنجاح!')}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{tr('Thank you for subscribing. Check your inbox for a confirmation email.', 'شكرًا لاشتراكك. تحقق من بريدك الإلكتروني لتأكيد الاشتراك.')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">{tr('Subscribe to Our Newsletter', 'اشترك في نشرتنا الإخبارية')}</h3>
                  
                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">{tr('Email Address', 'عنوان البريد الإلكتروني')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                        <FaRegEnvelope className="text-gray-400 text-sm sm:text-base" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                        placeholder={placeholderText || tr('Enter your email address', 'أدخل عنوان بريدك الإلكتروني')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {tr('I agree to receive promotional emails', 'أوافق على استلام الرسائل الترويجية')}
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="mb-3 sm:mb-4 text-red-600 text-xs sm:text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-md hover:bg-primary/90 transition duration-200 font-medium text-sm sm:text-base"
                  >
                    {buttonText || tr('Subscribe', 'اشترك')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSubscription; 