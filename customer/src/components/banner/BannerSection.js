import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from "@tanstack/react-query";
import BannerServices from "@services/BannerServices";
import useUtilsFunction from "@hooks/useUtilsFunction";

const BannerSection = ({ 
  title = "Banner Section Title", 
  description = "Sign up now to receive special offers and promotions",
  buttonText = "Apply Now",
  buttonLink = "/contact-us",
  bannerImage = "/images/banner/banner-bg.jpg"
}) => {
  // Get language and translation utility
  const { lang } = useUtilsFunction();
  
  // Fetch banner from API
  const { data: banners } = useQuery({
    queryKey: ["home-middle-banner"],
    queryFn: () => BannerServices.getBannersByLocation("home-middle"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use API data if available, otherwise use props
  const banner = banners?.banners?.[0];
  const displayTitle = banner ? (lang === 'ar' ? banner.titleAr || banner.title : banner.title) : title;
  const displayDescription = banner ? (lang === 'ar' ? banner.descriptionAr || banner.description : banner.description) : description;
  const displayButtonText = banner ? (lang === 'ar' ? banner.linkTextAr || banner.linkText || 'تسوق الآن' : (banner.linkText || buttonText)) : buttonText;
  const displayButtonLink = banner?.linkUrl || buttonLink;
  const displayBannerImage = banner?.imageUrl || bannerImage;
  const openInNewTab = banner?.openInNewTab || false;

  // Debug log for translations
  console.log('BannerSection banner data:', {
    banner,
    displayTitle,
    displayDescription,
    displayButtonText,
    lang
  });
  
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
            <Link 
              href={displayButtonLink}
              target={openInNewTab ? "_blank" : "_self"}
              rel={openInNewTab ? "noopener noreferrer" : ""}
              className="inline-block px-8 py-3 md:px-10 md:py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl text-sm md:text-base"
            >
              {displayButtonText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSection; 