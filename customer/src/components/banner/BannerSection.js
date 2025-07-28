import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from "@tanstack/react-query";
import BannerServices from "@services/BannerServices";
import useUtilsFunction from "@hooks/useUtilsFunction";

const BannerSection = () => {
  const { lang } = useUtilsFunction();

  // Fetch banner from API
  const { data: banners } = useQuery({
    queryKey: ["home-middle-banner"],
    queryFn: () => BannerServices.getBannersByLocation("home-middle"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Only use API data, do not render if no banner is returned
  const banner = banners?.banners?.[0];
  if (!banner || !banner.imageUrl) {
    return null;
  }

  // Helper function to safely extract text from object or string
  const getLocalizedText = (field, fallback = '') => {
    if (!field) return fallback;
    
    // If it's already a string, return as is
    if (typeof field === 'string') return field;
    
    // If it's an object with en/ar keys
    if (typeof field === 'object' && field !== null) {
      // Handle nested structure: {en: {en: "...", ar: "..."}, ar: "..."}
      if (lang === 'ar') {
        if (field.ar) {
          // If ar is a string, return it
          if (typeof field.ar === 'string') return field.ar;
          // If ar is an object, try to get the ar value from it
          if (typeof field.ar === 'object' && field.ar.ar) return field.ar.ar;
        }
        // Fallback to en.ar if ar is not available
        if (field.en && typeof field.en === 'object' && field.en.ar) return field.en.ar;
      }
      
      if (lang === 'en') {
        if (field.en) {
          // If en is a string, return it
          if (typeof field.en === 'string') return field.en;
          // If en is an object, try to get the en value from it
          if (typeof field.en === 'object' && field.en.en) return field.en.en;
        }
        // Fallback to ar.en if en is not available
        if (field.ar && typeof field.ar === 'object' && field.ar.en) return field.ar.en;
      }
      
      // Final fallbacks
      if (field.ar && typeof field.ar === 'string') return field.ar;
      if (field.en && typeof field.en === 'string') return field.en;
      if (field.ar && typeof field.ar === 'object' && field.ar.ar) return field.ar.ar;
      if (field.en && typeof field.en === 'object' && field.en.en) return field.en.en;
      
      // If all else fails, try to get any string value from the object
      const allValues = Object.values(field).flat();
      const stringValue = allValues.find(val => typeof val === 'string');
      if (stringValue) return stringValue;
    }
    
    // If it's already a string, return as is
    return field;
  };

  const displayTitle = getLocalizedText(banner.title, '');
  const displayDescription = getLocalizedText(banner.description, '');
  const displayButtonText = getLocalizedText(banner.linkText, '');
  const displayButtonLink = banner.linkUrl;
  const displayBannerImage = banner.imageUrl; // Should be a Cloudinary URL
  const openInNewTab = banner.openInNewTab || false;

  return (
    <div className="bg-white py-8 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative rounded-xl p-6 md:p-12 flex items-center justify-center overflow-hidden min-h-[280px] md:min-h-[320px]">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image 
              src={displayBannerImage}
              alt={lang === 'ar' ? 'خلفية الإعلان' : 'Banner Background'}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Responsive Overlay */}
          <div className={`absolute inset-0 bg-black bg-opacity-40 md:bg-gradient-to-${lang === 'ar' ? 'l' : 'r'} md:from-black/60 md:via-black/30 md:to-transparent z-[1]`}></div>
          {/* Content - Centered on mobile, direction-aware on desktop */}
          <div className={`relative z-10 text-center md:text-${lang === 'ar' ? 'right' : 'left'} max-w-2xl mx-auto md:mx-0 md:w-full`}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight">
              {displayTitle}
            </h2>
            <p className="text-white/90 text-base md:text-lg mb-6 md:mb-8 max-w-xl mx-auto md:mx-0 drop-shadow-md leading-relaxed">
              {displayDescription}
            </p>
            {displayButtonLink && displayButtonText && (
              <Link 
                href={displayButtonLink}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : ""}
                className="inline-block px-8 py-3 md:px-10 md:py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                {displayButtonText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSection; 