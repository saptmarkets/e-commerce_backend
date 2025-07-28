import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const LanguageSelector = ({ iconOnly = false }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Language configurations with native script names
  const languages = [
    { code: 'en', nativeName: 'English', otherName: 'عربي' },
    { code: 'ar', nativeName: 'عربي', otherName: 'English' }
  ];
  
  // Set the initial language based on the router locale or cookie
  useEffect(() => {
    // Clear any German or other language cookies
    const allCookies = Cookies.get();
    Object.keys(allCookies).forEach(cookieName => {
      if (cookieName.includes('lang') || cookieName.includes('locale')) {
        const cookieValue = allCookies[cookieName];
        try {
          const parsedValue = JSON.parse(cookieValue);
          if (parsedValue && parsedValue.code && !['en', 'ar'].includes(parsedValue.code)) {
            Cookies.remove(cookieName);
          }
        } catch (e) {
          // If it's not JSON, check if it's a string value
          if (typeof cookieValue === 'string' && !['en', 'ar'].includes(cookieValue)) {
            Cookies.remove(cookieName);
          }
        }
      }
    });

    const storedLocale = Cookies.get('NEXT_LOCALE');
    const currentLocale = router.locale || storedLocale || 'en';
    
    // Ensure only English or Arabic is used
    const validLocale = ['en', 'ar'].includes(currentLocale) ? currentLocale : 'en';
    
    // Set the correct cookies
    Cookies.set('NEXT_LOCALE', validLocale, { expires: 365 });
    Cookies.set('_lang', validLocale, { expires: 365 });
    Cookies.set('_curr_lang', JSON.stringify(languages.find(lang => lang.code === validLocale) || languages[0]), { expires: 365 });
    
    setSelectedLanguage(validLocale);
  }, [router.locale]);

  // Find current language and other language
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];
  const otherLanguage = languages.find(lang => lang.code !== selectedLanguage) || languages[1];
  
  const handleLanguageChange = (lang) => {
    // Set cookies for Next.js locale and custom language handling
    Cookies.set('NEXT_LOCALE', lang.code, { expires: 365 });
    Cookies.set('_lang', lang.code, { expires: 365 });
    Cookies.set('_curr_lang', JSON.stringify(lang), { expires: 365 });
    
    // Update the selected language
    setSelectedLanguage(lang.code);
    
    // Reload the page with the new language
    router.push(router.asPath, router.asPath, { locale: lang.code });
    
    // Close the dropdown
    setIsOpen(false);
  };

  // For iconOnly mode, directly toggle between languages
  const handleIconClick = () => {
    if (iconOnly) {
      handleLanguageChange(otherLanguage);
    } else {
      setIsOpen(!isOpen);
    }
  };
  
  return (
    <div className="relative">
      <button 
        className={`flex items-center justify-center text-gray-600 hover:text-purple-600 focus:outline-none transition-all duration-200 ${
          iconOnly 
            ? 'p-1.5 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded-xl hover:bg-gray-50 group touch-target flex items-center justify-center' 
            : 'text-sm font-medium hover:bg-gray-50 px-2 py-1.5 rounded-lg'
        }`}
        onClick={handleIconClick}
      >
        {/* Always show the other language name */}
        <span className={`font-medium ${iconOnly ? 'text-xs' : 'text-sm'}`}>
          {otherLanguage.nativeName}
        </span>
      </button>
      
      {!iconOnly && isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-36 bg-white rounded-xl shadow-lg z-50 border border-gray-100">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                selectedLanguage === language.code
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'
              }`}
              onClick={() => handleLanguageChange(language)}
            >
              <span>{language.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 