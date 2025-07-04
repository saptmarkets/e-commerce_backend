import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const LanguageSelector = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Only include English and Arabic
  const languages = [
    { code: 'en', name: 'ENGLISH', flag: 'us' },
    { code: 'ar', name: 'ARABIC', flag: 'sa' }
  ];
  
  // Set the initial language based on the router locale or cookie
  useEffect(() => {
    const storedLocale = Cookies.get('NEXT_LOCALE');
    const currentLocale = router.locale || storedLocale || 'en';
    setSelectedLanguage(currentLocale);
  }, [router.locale]);

  // Find current language or default to English
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];
  
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
  
  return (
    <div className="relative">
      <button 
        className="flex items-center text-sm font-medium text-gray-700 hover:text-green-600 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-1 text-md">{currentLanguage.name}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-32 bg-white rounded-md shadow-lg z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              className={`block w-full text-left px-4 py-2 text-sm ${
                selectedLanguage === language.code
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-green-600'
              }`}
              onClick={() => handleLanguageChange(language)}
            >
              {language.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 