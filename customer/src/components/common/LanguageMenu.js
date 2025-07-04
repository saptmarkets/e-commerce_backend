import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const LanguageMenu = () => {
  const router = useRouter();
  
  // Only include English and Arabic languages
  const languages = [
    { code: 'en', name: 'ENGLISH', flag: 'us' },
    { code: 'ar', name: 'ARABIC', flag: 'sa' }
  ];
  
  return (
    <div className="absolute right-0 top-12 bg-white shadow-lg rounded-md overflow-hidden z-50 w-40">
      {languages.map((language) => (
        <Link
          key={language.code}
          href={router.asPath}
          locale={language.code}
          className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
        >
          <span className={`flag-icon flag-icon-${language.flag} mr-2`}></span>
          <span>{language.name}</span>
        </Link>
      ))}
    </div>
  );
};

export default LanguageMenu; 