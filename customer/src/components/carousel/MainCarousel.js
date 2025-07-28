import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useQuery } from "@tanstack/react-query";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

//internal import
import BannerServices from "@services/BannerServices";
import useUtilsFunction from "@hooks/useUtilsFunction";

/**
 * MainCarousel Component with Multiple Animation Options
 * 
 * @param {string} animationType - The type of animation to use for center slides
 * Available options:
 * - 'fade': Simple fade-in effect (default)
 * - 'zoom': Zoom-in effect with hover scale
 * - 'slide': Slide-in from left/right
 * - 'modern': Modern zoom with rotation and gradient overlay
 * - 'parallax': Parallax zoom effect with depth
 */
const MainCarousel = ({ animationType = 'fade' }) => {
  // Get language and translation utility
  const { lang } = useUtilsFunction();
  const router = useRouter();
  // Force LTR direction for consistent animation regardless of language
  const isRTL = false;
  
  // Refs for Swiper instances
  const desktopSwiperRef = useRef(null);
  const mobileSwiperRef = useRef(null);
  const singleSwiperRef = useRef(null);
  
  // Fetch banners from API
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ["home-hero-banners"],
    queryFn: () => BannerServices.getBannersByLocation("home-hero"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Restart autoplay when banners data changes
  useEffect(() => {
    if (banners?.banners && banners.banners.length > 0) {
      // Restart autoplay for all swiper instances
      setTimeout(() => {
        if (desktopSwiperRef.current?.swiper) {
          desktopSwiperRef.current.swiper.autoplay.start();
        }
        if (mobileSwiperRef.current?.swiper) {
          mobileSwiperRef.current.swiper.autoplay.start();
        }
        if (singleSwiperRef.current?.swiper) {
          singleSwiperRef.current.swiper.autoplay.start();
        }
      }, 100);
    }
  }, [banners]);

  // Don't render anything if loading or no banners
  if (isLoading || !banners?.banners || banners.banners.length === 0) {
    return null;
  }

  // Convert API banners to slider format with proper translations
  const sliderData = banners.banners.map((banner, index) => {
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

    return {
      id: banner._id,
      title: getLocalizedText(banner.title, ''),
      info: getLocalizedText(banner.description, ''),
      buttonName: lang === 'ar' ? 
        getLocalizedText(banner.linkText, 'تسوق الآن') : 
        getLocalizedText(banner.linkText, 'Shop Now'),
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
    };
  });

  // Check if we have any triple layout banners (support both old and new fields)
  const hasTripleLayout = sliderData.some(item => 
    item.layoutType === 'triple' && (
      (item.leftImage && item.rightImage) || 
      (item.leftImage1 && item.rightImage1)
    )
  );
  
  // Get the first triple layout banner that has the most complete side image set
  // Prioritize banners with all 4 side images, then fall back to any triple layout banner
  const staticSideImages = hasTripleLayout ? sliderData.find(item => 
    item.layoutType === 'triple' && 
    item.leftImage1 && item.leftImage2 && item.rightImage1 && item.rightImage2
  ) || sliderData.find(item => 
    item.layoutType === 'triple' && (
      (item.leftImage && item.rightImage) || 
      (item.leftImage1 && item.rightImage1)
    )
  ) : null;

  // Prepare side images with legacy fallback
  const leftSideImage1 = staticSideImages?.leftImage1 || staticSideImages?.leftImage;
  const leftSideImage2 = staticSideImages?.leftImage2;
  const rightSideImage1 = staticSideImages?.rightImage1 || staticSideImages?.rightImage;
  const rightSideImage2 = staticSideImages?.rightImage2;

  // Single image layout component
  const SingleImageSlide = ({ item, i }) => (
    <div className="relative w-full h-full">
      <Image 
        src={item.image}
        alt={item.title}
        fill
        className="object-cover w-full h-full"
        sizes="100vw" // Add sizes prop for performance
        priority
        unoptimized={true} 
      />
      <div className="absolute inset-0 bg-black bg-opacity-30">
        <div className="flex flex-col justify-center h-full max-w-screen-xl mx-auto responsive-padding">
          <div className={`max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
            <h1 className="text-responsive-6xl font-black text-white mb-4 sm:mb-5 drop-shadow-md font-noor">
              {item.title}
            </h1>
            <p className="text-white text-responsive-2xl mb-5 sm:mb-7 md:mb-9 max-w-md drop-shadow-md font-noor">
              {item.info}
            </p>
            {item.url && item.buttonName && (
              <Link
                href={item.url}
                target={item.openInNewTab ? "_blank" : "_self"}
                rel={item.openInNewTab ? "noopener noreferrer" : ""}
                className="inline-block px-8 py-4 text-2xl font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition duration-200 shadow-lg font-noor"
              >
                {item.buttonName}
                </Link>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  // Triple layout center slide component with multiple animation options
  const TripleCenterSlide = ({ item, i, animationType = 'fade' }) => {
    // Animation variants
    const animationVariants = {
      fade: {
        container: "relative w-full h-full",
        image: "object-cover transition-all duration-1000 ease-out",
        overlay: "absolute inset-0 bg-black bg-opacity-30",
        content: `max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'} animate-slide-up`
      },
      zoom: {
        container: "relative w-full h-full overflow-hidden",
        image: "object-cover transition-transform duration-2000 ease-out hover:scale-110",
        overlay: "absolute inset-0 bg-black bg-opacity-30",
        content: `max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'} animate-slide-up-delayed`
      },
      slide: {
        container: "relative w-full h-full overflow-hidden",
        image: "object-cover",
        overlay: "absolute inset-0 bg-black bg-opacity-30",
        content: `max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'} animate-slide-in-right`
      },
      modern: {
        container: "relative w-full h-full overflow-hidden",
        image: "object-cover transition-all duration-1500 ease-out",
        overlay: "absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent",
        content: `max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'} animate-modern-slide-up`
      },
      parallax: {
        container: "relative w-full h-full overflow-hidden",
        image: "object-cover transition-transform duration-3000 ease-out",
        overlay: "absolute inset-0 bg-black bg-opacity-30",
        content: `max-w-lg ${isRTL ? 'ml-auto text-right' : 'mr-auto text-left'} animate-parallax-slide-up`
      }
    };

    const currentAnimation = animationVariants[animationType] || animationVariants.fade;

    return (
      <div className={currentAnimation.container}>
        <Image 
          src={item.image}
          alt={item.title}
          fill
          className={currentAnimation.image}
          sizes="100vw"
          priority
          unoptimized={true} 
        />
        <div className={currentAnimation.overlay}>
          <div className="flex flex-col justify-center h-full responsive-padding">
            <div className={currentAnimation.content}>
              <h1 className="text-responsive-5xl font-black text-white mb-4 sm:mb-5 drop-shadow-md font-noor">
                {item.title}
              </h1>
              <p className="text-white text-responsive-xl mb-4 sm:mb-6 md:mb-8 max-w-md drop-shadow-md font-noor">
                {item.info}
              </p>
              {item.url && item.buttonName && (
                <Link
                  href={item.url}
                  target={item.openInNewTab ? "_blank" : "_self"}
                  rel={item.openInNewTab ? "noopener noreferrer" : ""}
                  className="inline-block px-6 py-3 text-xl font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition duration-200 shadow-lg font-noor"
                >
                  {item.buttonName}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prepare slides for rendering - ensure enough slides for seamless looping
  let slidesToRender = [];
  if (sliderData.length === 1) {
    slidesToRender = [sliderData[0], sliderData[0], sliderData[0]]; // Duplicate one slide to ensure at least 3 for looping
  } else if (sliderData.length === 2) {
    slidesToRender = [...sliderData, ...sliderData]; // Duplicate two slides (A, B -> A, B, A, B) for robust looping
  } else {
    slidesToRender = sliderData; // Use original data if more than 2 slides
  }

  // Determine if carousel features (loop, autoplay, pagination, navigation) should be active
  // This is true if we have more than one *effective* slide for Swiper after duplication
  const hasMultipleSlides = slidesToRender.length > 1;
  
  // Common Swiper configuration
  const swiperConfig = {
    spaceBetween: 0,
    centeredSlides: false,
    autoplay: {
      delay: hasMultipleSlides ? 4000 : 0, // Increased delay to match transition duration
      disableOnInteraction: false, // Ensure autoplay continues after interaction
      pauseOnMouseEnter: true, // Pause on hover for better UX
    },
    loop: false, // Disable built-in loop to implement custom behavior
    pagination: {
      clickable: hasMultipleSlides, // Show pagination for multiple effective slides
      dynamicBullets: hasMultipleSlides,
    },
    navigation: hasMultipleSlides, // Show navigation for multiple effective slides
    modules: [Autoplay, Pagination, Navigation],
    className: "mySwiper h-full w-full",
    // Enhanced sliding effect - no fade transitions
    effect: "slide",
    speed: 800, // Slower, smoother sliding
    // Force re-render when config changes based on slide count
    key: `swiper-${slidesToRender.length}-${hasMultipleSlides}`,
  };



  return (
    <>
      <div className="w-full main-carousel">
        {hasTripleLayout ? (
          // Triple Layout: Center carousel with static side images
          <>
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center gap-2 swiper-responsive px-4">
              {/* Left Side Images (15%) - Fixed positions regardless of RTL/LTR */}
              <div className="flex flex-col gap-2 w-[15%] h-full">
                {leftSideImage1 && (
                  <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                    <Image 
                      src={leftSideImage1}
                      alt="Left Side Banner 1"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="15vw" // Add sizes prop for performance
                    />
                  </div>
                )}
                {leftSideImage2 && (
                  <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                    <Image 
                      src={leftSideImage2}
                      alt="Left Side Banner 2"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="15vw" // Add sizes prop for performance
                    />
                  </div>
                )}
              </div>

              {/* Center Sliding Content (70%) */}
              <div className="flex-1 rounded-lg overflow-hidden shadow-lg h-full">
                <Swiper
                  ref={desktopSwiperRef}
                  {...swiperConfig}
                  // Pass key directly as recommended by React
                  key={swiperConfig.key}
                  onSlideChange={(swiper) => {
                    // Custom loop behavior for hero carousel
                    const currentIndex = swiper.activeIndex;
                    const totalSlides = slidesToRender.length;
                    
                    // If we've reached the last slide, reset to the first slide
                    if (currentIndex >= totalSlides - 1) {
                      setTimeout(() => {
                        swiper.slideTo(0, 0, false);
                      }, 100);
                    }
                  }}
                >
                  {slidesToRender?.map((item, i) => (
                    <SwiperSlide
                      className="h-full w-full relative"
                      key={`slide-${item.id || i}-${i}`}
                    >
                      <TripleCenterSlide item={item} i={i} animationType={animationType} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Right Side Images (15%) - Fixed positions regardless of RTL/LTR */}
              <div className="flex flex-col gap-2 w-[15%] h-full">
                {rightSideImage1 && (
                  <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                    <Image 
                      src={rightSideImage1}
                      alt="Right Side Banner 1"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="15vw" // Add sizes prop for performance
                    />
                  </div>
                )}
                {rightSideImage2 && (
                  <div className="relative flex-1 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-gray-200">
                    <Image 
                      src={rightSideImage2}
                      alt="Right Side Banner 2"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="15vw" // Add sizes prop for performance
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout - Only Center Carousel (Side images hidden) */}
            <div className="md:hidden">
              {/* Center Sliding Content Only (Full width on mobile) */}
              <div className="w-full swiper-responsive rounded-lg overflow-hidden shadow-lg">
                <Swiper
                  ref={mobileSwiperRef}
                  {...swiperConfig}
                  // Pass key directly as recommended by React
                  key={swiperConfig.key}
                  onSlideChange={(swiper) => {
                    // Custom loop behavior for hero carousel
                    const currentIndex = swiper.activeIndex;
                    const totalSlides = slidesToRender.length;
                    
                    // If we've reached the last slide, reset to the first slide
                    if (currentIndex >= totalSlides - 1) {
                      setTimeout(() => {
                        swiper.slideTo(0, 0, false);
                      }, 100);
                    }
                  }}
                >
                  {slidesToRender?.map((item, i) => (
                    <SwiperSlide
                      className="h-full w-full relative"
                      key={`slide-${item.id || i}-${i}`}
                    >
                      <TripleCenterSlide item={item} i={i} animationType={animationType} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </>
        ) : (
          // Single Layout: Traditional full-width sliding
          <div className="w-full">
            <div className="swiper-responsive rounded-lg overflow-hidden shadow-lg">
              <Swiper
                ref={singleSwiperRef}
                {...swiperConfig}
                autoplay={hasMultipleSlides ? {
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                } : false}
                // Pass key directly as recommended by React
                key={swiperConfig.key}
                onSlideChange={(swiper) => {
                  // Custom loop behavior for hero carousel
                  const currentIndex = swiper.activeIndex;
                  const totalSlides = slidesToRender.length;
                  
                  // If we've reached the last slide, reset to the first slide
                  if (currentIndex >= totalSlides - 1) {
                    setTimeout(() => {
                      swiper.slideTo(0, 0, false);
                    }, 100);
                  }
                }}
              >
                {slidesToRender?.map((item, i) => (
                  <SwiperSlide
                    className="h-full w-full relative"
                    key={`slide-${item.id || i}-${i}`}
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
