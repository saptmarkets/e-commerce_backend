import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";

//internal import
import BannerServices from "@services/BannerServices";

const SidebarAds = ({ className = "" }) => {
  const router = useRouter();
  const lang = router.locale || 'en';
  
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

  // Fetch banners from API
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ["sidebar-ads-banners"],
    queryFn: () => BannerServices.getBannersByLocation("sidebar-ads"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't render if no banners or loading
  if (isLoading || !banners?.banners || banners.banners.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {banners.banners.map((banner, index) => (
        <div key={banner._id} className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden shadow-md">
          <Image 
            src={banner.imageUrl}
            alt={getLocalizedText(banner.title, 'Banner')}
            fill
            className="object-cover"
            sizes="300px"
            priority={index === 0}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 z-[1]"></div>
          
          {/* Content */}
          <div className="absolute inset-0 flex items-end z-10 p-4">
            <div className="text-white">
              <h3 className="text-sm md:text-base font-bold mb-1">{getLocalizedText(banner.title, '')}</h3>
              {banner.description && (
                <p className="text-xs md:text-sm mb-2 line-clamp-2">{getLocalizedText(banner.description, '')}</p>
              )}
              {banner.linkUrl && banner.linkText && (
                <Link 
                  href={banner.linkUrl}
                  target={banner.openInNewTab ? "_blank" : "_self"}
                  rel={banner.openInNewTab ? "noopener noreferrer" : ""}
                  className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition duration-200"
                >
                  {getLocalizedText(banner.linkText, '')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SidebarAds; 