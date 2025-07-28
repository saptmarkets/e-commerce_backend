import Image from "next/image";
import { useRouter } from "next/router";
import React, { useContext, useRef } from "react";
import { IoChevronBackOutline, IoChevronForward } from "react-icons/io5";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Controller, Navigation, Pagination } from "swiper/modules";
import { useQuery } from "@tanstack/react-query";

//internal import
import { SidebarContext } from "@context/SidebarContext";
import CategoryServices from "@services/CategoryServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import Loading from "@components/preloader/Loading";

const CategoryCarousel = () => {
  const router = useRouter();

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const { showingTranslateValue } = useUtilsFunction();
  const { isLoading, setIsLoading } = useContext(SidebarContext);

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["category"],
    queryFn: async () => await CategoryServices.getShowingCategory(),
  });

  // console.log("data", data, "error", error, "isFetched", isFetched);

  const handleCategoryClick = (id, category) => {
    router.push(`/category/${id}`);
    setIsLoading(!isLoading);
  };

  return (
    <>
      <Swiper
        onInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
        }}
        dir="ltr"
        autoplay={{
          delay: 4000, // Increased delay to match other carousels
          disableOnInteraction: false,
        }}
        spaceBetween={6}
        navigation={true}
        allowTouchMove={false}
        loop={false} // Disable built-in loop to implement custom behavior
        breakpoints={{
          // Mobile - smaller cards
          375: {
            width: 375,
            slidesPerView: 3,
            spaceBetween: 4,
          },
          // Small mobile
          414: {
            width: 414,
            slidesPerView: 4,
            spaceBetween: 4,
          },
          // Large mobile
          660: {
            width: 660,
            slidesPerView: 5,
            spaceBetween: 6,
          },
          // Tablet
          768: {
            width: 768,
            slidesPerView: 6,
            spaceBetween: 6,
          },
          // Small desktop
          991: {
            width: 991,
            slidesPerView: 8,
            spaceBetween: 8,
          },
          // Large desktop
          1140: {
            width: 1140,
            slidesPerView: 9,
            spaceBetween: 8,
          },
          // Extra large
          1680: {
            width: 1680,
            slidesPerView: 10,
            spaceBetween: 8,
          },
          1920: {
            width: 1920,
            slidesPerView: 10,
            spaceBetween: 8,
          },
        }}
        modules={[Autoplay, Navigation, Pagination, Controller]}
        className="mySwiper category-slider my-4 sm:my-6 swiper-ltr"
        onSlideChange={(swiper) => {
          // Custom loop behavior for category carousel
          const currentIndex = swiper.activeIndex;
          const totalSlides = data?.[0]?.children?.length || 0;
          
          // If we've reached the last slide, reset to the first slide
          if (currentIndex >= totalSlides - 1) {
            setTimeout(() => {
              swiper.slideTo(0, 0, false);
            }, 100);
          }
        }}
      >
        {loading ? (
          <Loading loading={loading} />
        ) : error ? (
          <p className="flex justify-center align-middle items-center m-auto text-responsive-lg text-red-500">
            {error?.response?.data?.message || error?.message}
          </p>
        ) : (
          <div>
            {data[0]?.children?.map((category, i) => (
              <SwiperSlide key={i + 1} className="group">
                <div
                  onClick={() =>
                    handleCategoryClick(category?._id, category.name)
                  }
                  className="text-center cursor-pointer card-responsive bg-white rounded-lg touch-target"
                >
                  <div className="bg-white p-1 sm:p-2 mx-auto w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full shadow-md">
                    <div className="relative w-4 h-4 sm:w-6 sm:h-6 md:w-6 md:h-8">
                      <Image
                        src={
                          category?.icon ||
                          "https://res.cloudinary.com/dxjobesyt/image/upload/v1752706908/placeholder_kvepfp_wkyfut.png"
                        }
                        alt="category"
                        width={40}
                        height={40}
                        className="object-fill"
                      />
                    </div>
                  </div>

                  <h3
                    className="text-responsive-xs text-gray-600 mt-1 sm:mt-2 font-serif group-hover:text-emerald-500 break-words whitespace-normal"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: (typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl') ? '0.7rem' : undefined
                    }}
                  >
                    {showingTranslateValue(category?.name)}
                  </h3>
                </div>
              </SwiperSlide>
            ))}
          </div>
        )}
        <button ref={prevRef} className="prev">
          <IoChevronBackOutline />
        </button>
        <button ref={nextRef} className="next">
          <IoChevronForward />
        </button>
      </Swiper>
    </>
  );
};

export default React.memo(CategoryCarousel);
