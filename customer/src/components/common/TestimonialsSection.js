import React, { useState } from 'react';
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Image from 'next/image';
import useUtilsFunction from '@hooks/useUtilsFunction';

const TestimonialsSection = ({ title, description, testimonials: propTestimonials }) => {
  const { showingTranslateValue } = useUtilsFunction();
  const [activeIndex, setActiveIndex] = useState(0);
  
  const defaultTestimonials = [
    {
      id: 1,
      name: { en: "Sarah Al-Mahmoud", ar: "سارة المحمود" },
      location: { en: "Riyadh", ar: "الرياض" },
      rating: 5,
      message: {
        en: "Outstanding quality and lightning-fast delivery! SAPT Markets has completely changed how I shop for groceries. The produce is always fresh, and the convenience is unmatched.",
        ar: "جودة رائعة وتوصيل سريع جدًا! أسواق سبت غيرت تمامًا طريقة تسوقي للبقالة. المنتجات دائمًا طازجة والراحة لا مثيل لها."
      },
      image: "https://randomuser.me/api/portraits/women/1.jpg"
    },
    {
      id: 2,
      name: { en: "Ahmed Al-Rashid", ar: "أحمد الراشد" },
      location: { en: "Jeddah", ar: "جدة" },
      rating: 5,
      message: {
        en: "Been using SAPT Markets for over a year now. The customer service is exceptional, and I love the variety of products available. Highly recommend to everyone!",
        ar: "أستخدم أسواق سبت منذ أكثر من عام. خدمة العملاء ممتازة وأحب تنوع المنتجات المتاحة. أنصح الجميع بها!"
      },
      image: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: 3,
      name: { en: "Fatima Al-Zahra", ar: "فاطمة الزهراء" },
      location: { en: "Dammam", ar: "الدمام" },
      rating: 5,
      message: {
        en: "The mobile app is so user-friendly, and the delivery team is always professional. SAPT Markets has made grocery shopping stress-free for our entire family.",
        ar: "تطبيق الجوال سهل الاستخدام جدًا وفريق التوصيل دائمًا محترف. أسواق سبت جعلت التسوق للبقالة خاليًا من التوتر لعائلتنا بأكملها."
      },
      image: "https://randomuser.me/api/portraits/women/2.jpg"
    }
  ];
  const testimonials = propTestimonials && propTestimonials.length > 0 ? propTestimonials : defaultTestimonials;
  
  const handlePrev = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            {title || 'What Our Customers Say'}
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto">
            {description || 'Real reviews from satisfied shoppers across Saudi Arabia'}
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Testimonial Cards */}
          <div className="bg-gray-50 rounded-xl shadow-md p-6 md:p-10 relative">
            <FaQuoteLeft className="text-primary text-opacity-20 text-6xl absolute top-6 left-6" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar */}
              <div className="w-24 h-24 relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
                  <Image 
                    src={testimonials[activeIndex].image} 
                    alt={testimonials[activeIndex].name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center md:text-left">
                <div className="flex mb-2 justify-center md:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={`text-yellow-400 ${i < testimonials[activeIndex].rating ? 'opacity-100' : 'opacity-40'}`} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 text-lg mb-4 italic">"{showingTranslateValue(testimonials[activeIndex].message)}"</p>
                
                <div>
                  <h4 className="font-semibold text-gray-800">— {showingTranslateValue(testimonials[activeIndex].name)}</h4>
                  <p className="text-gray-600">{showingTranslateValue(testimonials[activeIndex].location)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${index === activeIndex ? 'bg-primary' : 'bg-gray-300'}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Arrow Controls */}
          <button 
            onClick={handlePrev}
            className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
            aria-label="Previous testimonial"
          >
            <FaChevronLeft />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
            aria-label="Next testimonial"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection; 