import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Controller, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { IoChevronBackOutline, IoChevronForward } from 'react-icons/io5';

// Internal imports
import ProductCardModern from '@components/product/ProductCardModern';

const ProductCardCarousel = ({ products = [], attributes = [], slidesPerViewMobile = 2, fixedSlidesPerView = null }) => {
  const router = useRouter();
  const locale = router.locale || 'en';
  const isRTL = locale.startsWith('ar') || (typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl');
  // Force LTR direction for consistent animation regardless of language
  const sliderDirection = 'ltr';

  const swiperRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  
  // State to track if autoplay should be paused due to cart interaction
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  // Responsive slidesPerView detection
  const [currentSlidesPerView, setCurrentSlidesPerView] = useState(slidesPerViewMobile);
  useEffect(() => {
    function updateSlidesPerView() {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1280) {
          setCurrentSlidesPerView(Math.min(fixedSlidesPerView || 6, 6));
        } else if (window.innerWidth >= 1024) {
          setCurrentSlidesPerView(Math.min(fixedSlidesPerView || 5, 5));
        } else if (window.innerWidth >= 768) {
          setCurrentSlidesPerView(Math.min(fixedSlidesPerView || 4, 4));
        } else if (window.innerWidth >= 640) {
          setCurrentSlidesPerView(Math.min(fixedSlidesPerView || 3, 3));
        } else {
          setCurrentSlidesPerView(slidesPerViewMobile);
        }
      }
    }
    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, [fixedSlidesPerView, slidesPerViewMobile]);

  if (!products || products.length === 0) return null;

  const slidesPerViewConfig = fixedSlidesPerView || 'auto';

  // Build breakpoints when fixedSlidesPerView provided: mobile uses slidesPerViewMobile, desktop uses fixedSlidesPerView
  let responsiveBreakpoints = undefined;
  if (fixedSlidesPerView) {
    responsiveBreakpoints = {
      0: { 
        slidesPerView: slidesPerViewMobile,
        slidesPerGroup: 1, // Always scroll by 1 slide for smooth animation
        spaceBetween: slidesPerViewMobile === 1 ? 0 : 8, // No space for single slide view
        allowTouchMove: true, // Enable touch on mobile
        freeMode: false, // Disable free mode for controlled sliding
        loop: false, // Disable loop for custom behavior
        autoplay: {
          delay: 4000, // Increased delay to match transition duration
          disableOnInteraction: false, // Continue autoplay after user interaction
          pauseOnMouseEnter: true, // Pause on hover for better UX
          waitForTransition: true // Wait for transition to complete
        }
      },
      640: { 
        slidesPerView: Math.min(fixedSlidesPerView, 3),
        slidesPerGroup: 1,
        spaceBetween: 8, // Reduced space for better connection
        allowTouchMove: true,
        freeMode: false,
        loop: false, // Disable loop for custom behavior
        autoplay: {
          delay: 4000, // Consistent delay
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true
        }
      },
      768: { 
        slidesPerView: Math.min(fixedSlidesPerView, 4),
        slidesPerGroup: 1,
        spaceBetween: 8, // Reduced space for better connection
        allowTouchMove: true,
        freeMode: false,
        loop: false, // Disable loop for custom behavior
        autoplay: {
          delay: 4000, // Consistent delay
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true
        }
      },
      1024: { 
        slidesPerView: Math.min(fixedSlidesPerView, 5),
        slidesPerGroup: 1,
        spaceBetween: 8, // Reduced space for better connection
        allowTouchMove: true,
        freeMode: false,
        loop: false, // Disable loop for custom behavior
        autoplay: {
          delay: 4000, // Consistent delay
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true
        }
      },
      1280: { 
        slidesPerView: Math.min(fixedSlidesPerView, 6),
        slidesPerGroup: 1,
        spaceBetween: 8, // Reduced space for better connection
        allowTouchMove: true,
        freeMode: false,
        loop: false, // Disable loop for custom behavior
        autoplay: {
          delay: 4000, // Consistent delay
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
          waitForTransition: true
        }
      },
    };
  }

  // Only enable loop if enough slides to fill a full view and more than 1 slide
  // For loop to work properly, we need at least slidesPerView + 1 slides
  // Also ensure we have enough slides for the current breakpoint
  const enableLoop = products.length > Math.max(currentSlidesPerView, 1) && 
                    products.length > 1 && 
                    products.length >= (currentSlidesPerView + 1) &&
                    products.length >= (slidesPerViewMobile + 1) &&
                    products.length >= 3; // Minimum 3 slides for loop to work properly

  // Add loopedSlides to ensure proper loop behavior
  const loopedSlides = Math.max(currentSlidesPerView, 2);
  
  // Determine if we should use free mode (disable for single slide view on mobile)
  const shouldUseFreeMode = fixedSlidesPerView ? false : (slidesPerViewMobile > 1);
  


  // Force Swiper update on direction or product change
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      const swiperInstance = swiperRef.current.swiper;
      // Give a small delay to ensure DOM is ready for Swiper to update
      setTimeout(() => {
        swiperInstance.update();
        swiperInstance.slideTo(0, 0);
      }, 100); // Increased delay for better mobile compatibility
    }
  }, [sliderDirection, products.length]);

  // Listen for cart interactions to pause autoplay
  useEffect(() => {
    const handleCartInteraction = () => {
      if (swiperRef.current && swiperRef.current.swiper) {
        const swiper = swiperRef.current.swiper;
        if (swiper.autoplay && swiper.autoplay.running) {
          swiper.autoplay.stop();
          setIsAutoplayPaused(true);
        }
      }
    };

    // Listen for custom cart events
    window.addEventListener('product-added-to-cart', handleCartInteraction);
    window.addEventListener('cart-updated', handleCartInteraction);

    return () => {
      window.removeEventListener('product-added-to-cart', handleCartInteraction);
      window.removeEventListener('cart-updated', handleCartInteraction);
    };
  }, []);

  // Swiper class - always use LTR for consistent animation
  const swiperClass = `mySwiper swiper-ltr`;

  // Always use consistent LTR navigation arrows
  const PrevIcon = IoChevronBackOutline;
  const NextIcon = IoChevronForward;

  return (
    <div
      className={`product-card-carousel relative px-2 sm:px-4 md:px-6 lg:px-8`}
      data-slides-per-view={slidesPerViewMobile}
    >
      <Swiper
        key="ltr" // Always use LTR for consistent animation
        direction="horizontal" // Ensure direction is always horizontal
        dir="ltr" // Force LTR direction for consistent animation
        watchSlidesProgress={true}
        spaceBetween={8} // Reduced space between slides for better connection
        autoplay={{ 
          delay: 4000, // Increased delay to match new transition duration
          disableOnInteraction: false, // Continue autoplay after user interaction
          pauseOnMouseEnter: true, // Pause on hover for better UX
          waitForTransition: true, // Wait for transition to complete
          stopOnLastSlide: false // Continue looping with custom behavior
        }}
        slidesPerView={slidesPerViewConfig}
        slidesPerGroup={1} // Always scroll by 1 slide for smooth animation
        freeMode={shouldUseFreeMode}
        loop={false} // Disable built-in loop to implement custom behavior
        allowTouchMove={true} // Enable touch movement
        breakpoints={responsiveBreakpoints}
        modules={[Navigation, Pagination, Autoplay, Controller, FreeMode]}
        className={swiperClass}
        data-slides-per-view={slidesPerViewMobile}
        onInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
          
          // Force autoplay to start
          setTimeout(() => {
            if (swiper.autoplay && swiper.autoplay.start) {
              swiper.autoplay.start();
            }
          }, 1000);
        }}
        onSwiper={(swiper) => {
          // Additional initialization for mobile
          if (typeof window !== 'undefined' && window.innerWidth <= 640) {
            swiper.allowTouchMove = true;
            swiper.freeMode = false;
            
            // Force autoplay to start on mobile
            setTimeout(() => {
              if (swiper.autoplay && swiper.autoplay.start) {
                swiper.autoplay.start();
              }
            }, 1500);
          }
          

          
          // Additional mobile fixes for single slide view
          if (slidesPerViewMobile === 1) {
            swiper.allowTouchMove = true;
            swiper.touchRatio = 1;
            swiper.touchAngle = 45;
            swiper.grabCursor = true;
          }
        }}
        onSlideChange={(swiper) => {
          // Don't interfere with manual slide changes
          // Let Swiper handle natural sliding behavior
        }}
        onTouchStart={(swiper) => {
          // Resume autoplay when user manually touches/swipes
          if (isAutoplayPaused && swiper.autoplay) {
            swiper.autoplay.start();
            setIsAutoplayPaused(false);
          }
        }}
        onSlideNextTransitionStart={(swiper) => {
          // Resume autoplay when user manually navigates with arrows
          if (isAutoplayPaused && swiper.autoplay) {
            swiper.autoplay.start();
            setIsAutoplayPaused(false);
          }
        }}
        onSlidePrevTransitionStart={(swiper) => {
          // Resume autoplay when user manually navigates with arrows
          if (isAutoplayPaused && swiper.autoplay) {
            swiper.autoplay.start();
            setIsAutoplayPaused(false);
          }
        }}
        onAutoplayTimeLeft={(swiper, timeLeft, progress) => {
          // Custom loop behavior only for autoplay
          const currentIndex = swiper.activeIndex;
          const totalSlides = products.length;
          
          // If we're at the last slide and autoplay is about to end, reset to first
          if (currentIndex >= totalSlides - 1 && timeLeft < 100) {
            setTimeout(() => {
              swiper.slideTo(0, 0, false);
            }, 100);
          }
        }}
      >
        {products.map((product) => (
          <SwiperSlide 
            key={product._id} 
            className={`h-auto ${
              fixedSlidesPerView && slidesPerViewMobile === 1 
                ? 'w-full' 
                : fixedSlidesPerView 
                  ? '' 
                  : 'w-56 sm:w-60 md:w-64 lg:w-72'
            }`}
          >
            <ProductCardModern
              product={product}
              attributes={attributes}
              compact={false}
              showQuantitySelector={true}
              showFavorite={true}
              promotion={product.promotion}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Navigation buttons positioned outside the carousel */}
      <button
        ref={prevRef}
        className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-200 border border-gray-200"
        aria-label="Previous"
      >
        <PrevIcon className="text-purple-600" size={24} />
      </button>
      <button
        ref={nextRef}
        className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 rounded-full shadow-lg p-2 hover:shadow-xl transition-all duration-200 border border-gray-200"
        aria-label="Next"
      >
        <NextIcon className="text-purple-600" size={24} />
      </button>
    </div>
  );
};

export default ProductCardCarousel; 