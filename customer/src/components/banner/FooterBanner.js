import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

//internal import
import BannerServices from "@services/BannerServices";

const FooterBanner = () => {
  // Fetch banners from API
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ["footer-banner"],
    queryFn: () => BannerServices.getBannersByLocation("footer-banner"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't render if no banners or loading
  if (isLoading || !banners?.banners || banners.banners.length === 0) {
    return null;
  }

  const banner = banners.banners[0]; // Only one banner allowed for this location

  return (
    <div className="w-full mb-8">
      <div className="relative w-full h-[120px] md:h-[150px] rounded-lg overflow-hidden">
        <Image 
          src={banner.imageUrl}
          alt={banner.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/60 z-[1]"></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white px-4">
            <h2 className="text-base md:text-xl font-bold mb-1">{banner.title}</h2>
            {banner.description && (
              <p className="text-xs md:text-sm mb-3 max-w-xl">{banner.description}</p>
            )}
            {banner.linkUrl && banner.linkText && (
              <Link 
                href={banner.linkUrl}
                target={banner.openInNewTab ? "_blank" : "_self"}
                rel={banner.openInNewTab ? "noopener noreferrer" : ""}
                className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition duration-200"
              >
                {banner.linkText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterBanner; 