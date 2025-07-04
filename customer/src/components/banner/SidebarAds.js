import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

//internal import
import BannerServices from "@services/BannerServices";

const SidebarAds = ({ className = "" }) => {
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
            alt={banner.title}
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
              <h3 className="text-sm md:text-base font-bold mb-1">{banner.title}</h3>
              {banner.description && (
                <p className="text-xs md:text-sm mb-2 line-clamp-2">{banner.description}</p>
              )}
              {banner.linkUrl && banner.linkText && (
                <Link 
                  href={banner.linkUrl}
                  target={banner.openInNewTab ? "_blank" : "_self"}
                  rel={banner.openInNewTab ? "noopener noreferrer" : ""}
                  className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition duration-200"
                >
                  {banner.linkText}
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