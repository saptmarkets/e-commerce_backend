import React, { useState } from 'react';
import { FaRegEnvelope, FaCheckCircle, FaTag, FaRegClock, FaBell, FaUserCheck } from 'react-icons/fa';
import useUtilsFunction from '@hooks/useUtilsFunction';

const NewsletterSubscription = ({ title, description, buttonText, placeholderText, benefits: propBenefits }) => {
  const { showingTranslateValue } = useUtilsFunction();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!agreed) {
      setError('Please agree to receive promotional emails');
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
    <div className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {title || 'Stay Connected with SAPT Markets'}
              </h2>
              <p className="text-gray-600 mb-6">
                {description || 'Join over 50,000 satisfied customers who receive exclusive deals, seasonal offers, and insider updates'}
              </p>
              
              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <span className="flex-shrink-0">
                      {benefit.icon || getIconByType(benefit.iconType)}
                    </span>
                    <span className="text-gray-700">
                      {typeof benefit.text === 'string' ? benefit.text : showingTranslateValue(benefit.text)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              {submitted ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Successfully Subscribed!</h3>
                  <p className="text-gray-600">Thank you for subscribing. Check your inbox for a confirmation email.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Subscribe to Our Newsletter</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaRegEnvelope className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder={placeholderText || "your@email.com"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="agreement"
                          type="checkbox"
                          className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                          checked={agreed}
                          onChange={() => setAgreed(!agreed)}
                        />
                      </div>
                      <label htmlFor="agreement" className="ml-2 text-sm text-gray-600">
                        I agree to receive promotional emails
                      </label>
                    </div>
                  </div>
                  
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition duration-200"
                  >
{buttonText || 'Subscribe & Save'}
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    We respect your privacy. Unsubscribe anytime.
                  </p>
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