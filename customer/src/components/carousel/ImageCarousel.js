import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef } from "react";
import { IoChevronBackOutline, IoChevronForward } from "react-icons/io5"; // requires a loader
import { Autoplay, Controller, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";

const ImageCarousel = ({ images, handleChangeImage }) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <>
      <Swiper
        spaceBetween={1}
        navigation={true}
        allowTouchMove={false}
        loop={false} // Disable built-in loop to implement custom behavior
        autoplay={{
          delay: 4000, // Increased delay to match other carousels
          disableOnInteraction: false,
        }}
        slidesPerView={4}
        modules={[Autoplay, Navigation, Pagination, Controller]}
        className="mySwiper image-carousel swiper-ltr"
        dir="ltr"
        onSlideChange={(swiper) => {
          // Custom loop behavior for image carousel
          const currentIndex = swiper.activeIndex;
          const totalSlides = images?.length || 0;
          
          // If we've reached the last slide, reset to the first slide
          if (currentIndex >= totalSlides - 1) {
            setTimeout(() => {
              swiper.slideTo(0, 0, false);
            }, 100);
          }
        }}
      >
        {images?.map((img, i) => (
          <SwiperSlide key={i + 1} className="group">
            <button onClick={() => handleChangeImage(img)}>
              <Image
                className="border inline-flex items-center justify-center px-3 py-1 mt-2"
                src={img}
                alt="product"
                width={100}
                height={100}
              />
            </button>
          </SwiperSlide>
        ))}
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

export default dynamic(() => Promise.resolve(ImageCarousel), { ssr: false });
