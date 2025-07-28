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
  const { showingTranslateValue, lang, tr } = useUtilsFunction();

  if (!isSectionActive('why_choose_us')) {
    return null;
  }

  const settings = getSectionSettings('why_choose_us');
  const sectionData = sections?.find(s => s.sectionId === 'why_choose_us');
  const title = sectionData?.content?.title;
  const subtitle = sectionData?.content?.subtitle;
  const description = sectionData?.content?.description;
  const stats = Array.isArray(sectionData?.content?.stats) && sectionData.content.stats.length > 0 ? sectionData.content.stats : [
    { value: { en: 'Thousands of', ar: 'آلاف' }, label: { en: 'Satisfied Customers', ar: 'عملاء راضون' } },
    { value: { en: 'Exclusive', ar: 'حصرية' }, label: { en: 'Product Range', ar: 'مجموعة منتجات' } },
    { value: { en: '24/7', ar: '24/7' }, label: { en: 'Customer Support', ar: 'دعم العملاء' } },
    { value: { en: '4.8/5', ar: '4.8/5' }, label: { en: 'Average Rating', ar: 'متوسط التقييم' } }
  ];

  return (
    <div className="bg-gray-50 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-12 lg:gap-16 items-center">
          <div>
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 font-noor">
                {/* Split the title to color 'أسواق سبت' in purple, rest in green */}
                {(() => {
                  const t = showingTranslateValue(title) || '';
                  // Support both 'أسواق سبت' and 'أسواق سبت المركزية'
                  const brand = t.includes('أسواق سبت المركزية') ? 'أسواق سبت المركزية' : 'أسواق سبت';
                  if (t.includes(brand)) {
                    const [before, after] = t.split(brand);
                    return <>
                      <span style={{color:'#76bd44'}}>{before}</span>
                      <span className="brand-name-arabic" style={{color:'#74338c', fontWeight:'900', letterSpacing: '0.5px'}}>{brand}</span>
                      <span style={{color:'#76bd44'}}>{after}</span>
                    </>;
                  }
                  // For English, split "Why Choose SAPT Markets?" to use both colors
                  if (t.includes('Why Choose') && t.includes('SAPT Markets')) {
                    const parts = t.split('SAPT Markets');
                    return <>
                      <span style={{color:'#76bd44'}}>{parts[0]}</span>
                      <span className="brand-name-arabic" style={{color:'#74338c', fontWeight:'900', letterSpacing: '0.5px'}}>SAPT Markets</span>
                      <span style={{color:'#76bd44'}}>{parts[1] || ''}</span>
                    </>;
                  }
                  // fallback: all green
                  return <span style={{color:'#76bd44'}}>{t}</span>;
                })()}
              </h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-green-700 font-semibold mt-2 sm:mt-3 md:mt-4 lg:mt-6 font-noor" style={{color:'#76bd44'}}>
                {showingTranslateValue(subtitle)}
              </h3>
              <p className="text-gray-600 mt-3 sm:mt-4 md:mt-5 lg:mt-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8 max-w-lg text-base sm:text-lg md:text-xl font-noor leading-relaxed" style={{color:'#74338c', textShadow:'0 1px 4px #eaeaea'}}>
                {showingTranslateValue(description)}
              </p>
            </div>
          </div>
          
          {settings?.showStats !== false && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8 lg:mb-0">
              {stats.map((stat, index) => {
                const valueStr = toPlainString(typeof stat.value === 'object' ? (stat.value[lang] || stat.value.en) : stat.value);
                const labelStr = toPlainString(stat.label ? (typeof stat.label === 'object' ? (stat.label[lang] || stat.label.en || '') : stat.label) : '');
                return (
                  <div key={index} className="bg-white p-3 sm:p-4 md:p-5 lg:p-8 rounded-xl text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-green-600 mb-2 sm:mb-3 font-noor">{valueStr}</h3>
                    {labelStr && <p className="text-gray-600 text-sm sm:text-base md:text-lg font-noor font-medium">{labelStr}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Move buttons to the end and make them smaller for mobile */}
        {settings?.showButtons !== false && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8 lg:mt-12 justify-center">
            <Link 
              href="/products" 
              className="inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-200 text-xs sm:text-sm md:text-base no-underline font-noor"
              style={{ minHeight: 'auto', lineHeight: '1.2' }}
            >
              {tr('Start Shopping', 'ابدأ التسوق')}
            </Link>
            <Link 
              href="/about-us" 
              className="inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-purple-700 text-purple-700 font-medium rounded-md hover:bg-purple-50 transition duration-200 text-xs sm:text-sm md:text-base no-underline font-noor"
              style={{ minHeight: 'auto', lineHeight: '1.2' }}
            >
              {tr('Learn Our Story', 'تعرف على قصتنا')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicSupermarketStats; 