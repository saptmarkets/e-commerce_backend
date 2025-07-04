import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useQuery } from "@tanstack/react-query";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

//internal import
import BannerServices from "@services/BannerServices";

const PromotionsHeroBanner = () => {
  // Fetch banners from API
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ["promotions-hero-banners"],
    queryFn: () => BannerServices.getBannersByLocation("promotions-hero"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't render if no banners or loading
  if (isLoading || !banners?.banners || banners.banners.length === 0) {
    return null;
  }

  // Convert API banners to slider format
  const sliderData = banners.banners.map((banner) => ({
    id: banner._id,
    title: banner.title,
    info: banner.description,
    buttonName: banner.linkText || "Shop Now",
    url: banner.linkUrl || "/products",
    image: banner.imageUrl,
    openInNewTab: banner.openInNewTab
  }));

  // If only one banner, show as static banner
  if (sliderData.length === 1) {
    const banner = sliderData[0];
    return (
      <div className="w-full mb-4">
        <div className="relative w-full h-[200px] md:h-[250px] rounded-lg overflow-hidden">
          <Image 
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 to-pink-900/70 z-[1]"></div>
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center z-10">
            <div className="text-white px-8 max-w-2xl">
              <h2 className="text-xl md:text-2xl font-bold mb-2">{banner.title}</h2>
              {banner.info && (
                <p className="text-sm md:text-base mb-4">{banner.info}</p>
              )}
              {banner.url && banner.buttonName && (
                <Link 
                  href={banner.url}
                  target={banner.openInNewTab ? "_blank" : "_self"}
                  rel={banner.openInNewTab ? "noopener noreferrer" : ""}
                  className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 transition duration-200 text-sm"
                >
                  {banner.buttonName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple banners - show as carousel
  return (
    <div className="w-full mb-4">
      <div className="w-full rounded-lg overflow-hidden">
        <Swiper
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={sliderData.length > 1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={sliderData.length > 1}
          modules={[Autoplay, Pagination, Navigation]}
          className="mySwiper"
        >
          {sliderData.map((item) => (
            <SwiperSlide
              className="h-full relative rounded-lg overflow-hidden"
              key={item.id}
            >
              <div className="relative w-full h-[200px] md:h-[250px]">
                <Image 
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/70 to-pink-900/70 z-[1]"></div>
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center z-10">
                  <div className="text-white px-8 max-w-2xl">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h2>
                    {item.info && (
                      <p className="text-sm md:text-base mb-4">{item.info}</p>
                    )}
                    {item.url && item.buttonName && (
                      <Link 
                        href={item.url}
                        target={item.openInNewTab ? "_blank" : "_self"}
                        rel={item.openInNewTab ? "noopener noreferrer" : ""}
                        className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-md hover:from-purple-700 hover:to-pink-700 transition duration-200 text-sm"
                      >
                        {item.buttonName}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default PromotionsHeroBanner; 