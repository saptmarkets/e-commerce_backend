import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useHomepageSections from '@hooks/useHomepageSections';
import useUtilsFunction from '@hooks/useUtilsFunction';

// Helper to safely convert value/label that may be malformed objects into plain string
const toPlainString = (input) => {
  if (!input) return '';
  if (typeof input === 'string') return input;
  if (typeof input === 'object') {
    // If looks like char map (numeric keys)
    const keys = Object.keys(input);
    const isCharMap = keys.every(k => !isNaN(k));
    if (isCharMap) {
      return keys.sort((a,b)=>a-b).map(k => input[k]).join('');
    }
    // If translation object {en, ar}
    if (keys.includes('en') || keys.includes('ar')) {
      // default to joining all values with space
      return Object.values(input).join(' ');
    }
    // Fallback join
    return Object.values(input).join('');
  }
  return String(input);
};

const DynamicSupermarketStats = () => {
  const { sections, getSectionContent, getSectionSettings, isSectionActive } = useHomepageSections();
  const { showingTranslateValue, lang } = useUtilsFunction();

  if (!isSectionActive('why_choose_us')) {
    return null;
  }

  const settings = getSectionSettings('why_choose_us');
  const title = getSectionContent('why_choose_us', 'title');
  const subtitle = getSectionContent('why_choose_us', 'subtitle');
  const description = getSectionContent('why_choose_us', 'description');

  // Get stats from content
  const sectionData = sections?.find(s => s.sectionId === 'why_choose_us');
  const stats = Array.isArray(sectionData?.content?.stats) && sectionData.content.stats.length > 0 ? sectionData.content.stats : [
    { value: { en: 'Thousands of', ar: 'آلاف' }, label: { en: 'Satisfied Customers', ar: 'عملاء راضون' } },
    { value: { en: 'Exclusive', ar: 'حصرية' }, label: { en: 'Product Range', ar: 'مجموعة منتجات' } },
    { value: { en: '24/7', ar: '24/7' }, label: { en: 'Customer Support', ar: 'دعم العملاء' } },
    { value: { en: '4.8/5', ar: '4.8/5' }, label: { en: 'Average Rating', ar: 'متوسط التقييم' } }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <div className="mb-8">
              <h2 className="font-bold mb-2">
                <span className="text-4xl md:text-5xl" style={{ color: "#76bd44" }}>Why Choose</span><br />
                <span className="text-4xl md:text-5xl text-gray-800">SAPT</span><br />
                <span className="text-4xl md:text-5xl" style={{ color: "#74338c" }}>Markets?</span>
              </h2>
              <h3 className="text-2xl text-gray-800 font-semibold mt-4">
                {showingTranslateValue(subtitle) || "Saudi Arabia's Leading Online Supermarket"}
              </h3>
              <p className="text-gray-600 mt-6 mb-8 max-w-md text-lg">
                {showingTranslateValue(description) || "Discover thousands of premium products across all categories — from fresh produce to household essentials — all at competitive prices with unmatched convenience."}
              </p>
            </div>
            
            {settings?.showButtons !== false && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/products" 
                  className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-200"
                >
                  Start Shopping
                </Link>
                <Link 
                  href="/about-us" 
                  className="px-8 py-3 border border-purple-700 text-purple-700 font-medium rounded-md hover:bg-purple-50 transition duration-200"
                >
                  Learn Our Story
                </Link>
              </div>
            )}
          </div>
          
          {settings?.showStats !== false && (
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const valueStr = toPlainString(typeof stat.value === 'object' ? (stat.value[lang] || stat.value.en) : stat.value);
                const labelStr = toPlainString(stat.label ? (typeof stat.label === 'object' ? (stat.label[lang] || stat.label.en || '') : stat.label) : '');
                return (
                  <div key={index} className="bg-white p-6 rounded-lg text-center shadow-sm">
                    <h3 className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{valueStr}</h3>
                    {labelStr && <p className="text-gray-600">{labelStr}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicSupermarketStats; 