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
import useUtilsFunction from "@hooks/useUtilsFunction";

const MainCarousel = () => {
  // Get language and translation utility
  const { lang, showingTranslateValue } = useUtilsFunction();
  
  // Fetch banners from API
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ["home-hero-banners"],
    queryFn: () => BannerServices.getBannersByLocation("home-hero"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't render anything if loading or no banners
  if (isLoading || !banners?.banners || banners.banners.length === 0) {
    return null;
  }

  // Debug log
  console.log('MainCarousel banners:', banners?.banners);

  // Convert API banners to slider format with proper translations
  const sliderData = banners.banners.map((banner, index) => ({
    id: banner._id,
    title: showingTranslateValue(banner.title),
    info: showingTranslateValue(banner.description),
    buttonName: showingTranslateValue(banner.linkText) || (lang === 'ar' ? 'تسوق الآن' : 'Shop Now'),
    url: banner.linkUrl || "/products",
    image: banner.imageUrl,
    leftImage: banner.leftImageUrl,
    rightImage: banner.rightImageUrl,
    leftImage1: banner.leftImageUrl1,
    leftImage2: banner.leftImageUrl2,
    rightImage1: banner.rightImageUrl1,
    rightImage2: banner.rightImageUrl2,
    layoutType: banner.layoutType || 'single',
    leftImageAnimation: banner.leftImageAnimation || 'slideUp',
    rightImageAnimation: banner.rightImageAnimation || 'slideUp',
    centerImageAnimation: banner.centerImageAnimation || 'slideRight',
    openInNewTab: banner.openInNewTab
  }));

  console.log('Processed sliderData with translations:', sliderData);

  // Check if we have any triple layout banners (support both old and new fields)
  const hasTripleLayout = sliderData.some(item => 
    item.layoutType === 'triple' && (
      (item.leftImage && item.rightImage) || 
      (item.leftImage1 && item.rightImage1)
    )
  );
  
  // Get static side images from the first triple layout banner for static display
  const staticSideImages = hasTripleLayout ? sliderData.find(item => 
    item.layoutType === 'triple' && (
      (item.leftImage && item.rightImage) || 
      (item.leftImage1 && item.rightImage1)
    )
  ) : null;

  // Single image layout component
  const SingleImageSlide = ({ item, i }) => (
    <div className="relative w-full h-[220px] md:h-[300px]">
      <Image 
        src={item.image}
        alt={item.title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        unoptimized={true} 
      />
      <div className="absolute inset-0 bg-black bg-opacity-30">
        <div className="flex flex-col justify-center h-full max-w-screen-xl mx-auto px-6 md:px-10">
          <div className={`max-w-lg ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-md">
              {item.title}
            </h1>
            <p className="text-white text-lg mb-6 max-w-md drop-shadow-md">
              {item.info}
            </p>
            {item.url && item.buttonName && (
              <Link
                href={item.url}
                target={item.openInNewTab ? "_blank" : "_self"}
                rel={item.openInNewTab ? "noopener noreferrer" : ""}
                className="inline-block px-8 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition duration-200 shadow-lg"
              >
                {item.buttonName}
                </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  // Triple layout center slide component
  const TripleCenterSlide = ({ item, i }) => (
    <div className="relative w-full h-full">
      <Image 
        src={item.image}
        alt={item.title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        unoptimized={true} 
      />
      <div className="absolute inset-0 bg-black bg-opacity-30">
        <div className="flex flex-col justify-center h-full px-4 md:px-8">
          <div className={`max-w-lg ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-md">
              {item.title}
            </h1>
            <p className="text-white text-sm md:text-base mb-4 max-w-md drop-shadow-md">
              {item.info}
            </p>
            {item.url && item.buttonName && (
              <Link
                href={item.url}
                target={item.openInNewTab ? "_blank" : "_self"}
                rel={item.openInNewTab ? "noopener noreferrer" : ""}
                className="inline-block px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition duration-200 shadow-lg text-sm md:text-base"
              >
                {item.buttonName}
                </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full">
        {hasTripleLayout ? (
          // Triple Layout: Center carousel with static side images
          <>
            {/* Desktop Layout */}
            <div className={`hidden md:flex items-center gap-2 h-[300px] px-4 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
              {/* Left Side Images (15%) - RTL aware positioning */}
              <div className="flex flex-col gap-2 w-[15%] h-full">
                {/* For RTL, we show right images on the left side */}
                {lang === 'ar' ? (
                  <>
                    {staticSideImages?.rightImage1 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.rightImage1}
                          alt={lang === 'ar' ? 'إعلان جانبي ١' : 'Side Banner 1'}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                    {staticSideImages?.rightImage2 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.rightImage2}
                          alt={lang === 'ar' ? 'إعلان جانبي ٢' : 'Side Banner 2'}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {staticSideImages?.leftImage1 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.leftImage1}
                          alt="Side Banner 1"
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                    {staticSideImages?.leftImage2 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.leftImage2}
                          alt="Side Banner 2"
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Center Sliding Content (70%) */}
              <div className="flex-1 rounded-lg overflow-hidden shadow-lg h-full">
                <Swiper
                  spaceBetween={0}
                  centeredSlides={true}
                  autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                  }}
                  loop={true}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  navigation={true}
                  modules={[Autoplay, Pagination, Navigation]}
                  className="mySwiper h-[300px]"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {sliderData?.map((item, i) => (
                    <SwiperSlide
                      className="h-full relative"
                      key={i + 1}
                    >
                      <TripleCenterSlide item={item} i={i} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Right Side Images (15%) - RTL aware positioning */}
              <div className="flex flex-col gap-2 w-[15%] h-full">
                {/* For RTL, we show left images on the right side */}
                {lang === 'ar' ? (
                  <>
                    {staticSideImages?.leftImage1 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.leftImage1}
                          alt={lang === 'ar' ? 'إعلان جانبي ٣' : 'Side Banner 3'}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                    {staticSideImages?.leftImage2 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.leftImage2}
                          alt={lang === 'ar' ? 'إعلان جانبي ٤' : 'Side Banner 4'}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {staticSideImages?.rightImage1 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.rightImage1}
                          alt="Side Banner 3"
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                    {staticSideImages?.rightImage2 && (
                      <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                        <Image 
                          src={staticSideImages.rightImage2}
                          alt="Side Banner 4"
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="15vw"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile Layout - Only Center Carousel (Side images hidden) */}
            <div className="md:hidden">
              {/* Center Sliding Content Only (Full width on mobile) */}
              <div className="w-full h-[220px] rounded-lg overflow-hidden shadow-lg">
                <Swiper
                  spaceBetween={0}
                  centeredSlides={true}
                  autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                  }}
                  loop={true}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  navigation={false}
                  modules={[Autoplay, Pagination]}
                  className="mySwiper h-full"
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {sliderData?.map((item, i) => (
                    <SwiperSlide
                      className="h-full relative"
                      key={i + 1}
                    >
                      <TripleCenterSlide item={item} i={i} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </>
        ) : (
          // Single Layout: Traditional full-width sliding
          <div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <Swiper
                spaceBetween={0}
                centeredSlides={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                loop={true}
                pagination={{
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={true}
                modules={[Autoplay, Pagination, Navigation]}
                className="mySwiper"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                {sliderData?.map((item, i) => (
                  <SwiperSlide
                    className="h-full relative"
                    key={i + 1}
                  >
                    <SingleImageSlide item={item} i={i} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MainCarousel;
