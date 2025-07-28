const HomepageSection = require("../models/HomepageSection");

// Get all homepage sections
const getAllHomepageSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find({}).sort({ sortOrder: 1 });
    res.send(sections);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get active homepage sections only
const getActiveHomepageSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find({ isActive: true }).sort({ sortOrder: 1 });
    res.send(sections);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get single homepage section
const getHomepageSection = async (req, res) => {
  try {
    const section = await HomepageSection.findOne({ sectionId: req.params.sectionId });
    if (!section) {
      return res.status(404).send({ message: "Section not found" });
    }
    res.send(section);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update homepage section
const updateHomepageSection = async (req, res) => {
  try {
    const updatedSection = await HomepageSection.findOneAndUpdate(
      { sectionId: req.params.sectionId },
      req.body,
      { new: true, upsert: true }
    );

    res.send({
      data: updatedSection,
      message: "Homepage section updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update sections order
const updateSectionsOrder = async (req, res) => {
  try {
    const { sections } = req.body;
    
    // Update each section's sort order
    const updatePromises = sections.map((section, index) =>
      HomepageSection.findOneAndUpdate(
        { sectionId: section.sectionId },
        { sortOrder: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.send({
      message: "Sections order updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Toggle section visibility
const toggleSectionVisibility = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { isActive } = req.body;

    const updatedSection = await HomepageSection.findOneAndUpdate(
      { sectionId },
      { isActive },
      { new: true }
    );

    if (!updatedSection) {
      return res.status(404).send({ message: "Section not found" });
    }

    res.send({
      data: updatedSection,
      message: `Section ${isActive ? 'enabled' : 'disabled'} successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Initialize default sections
const initializeDefaultSections = async (req, res) => {
  try {
    const defaultSections = [
      {
        sectionId: 'hero',
        name: { en: 'Hero Section', ar: 'القسم الرئيسي' },
        description: 'Main carousel/banner section',
        sortOrder: 0,
        isActive: true,
        settings: {
          managedBy: 'banners',
          bannerLocation: 'hero'
        }
      },
      {
        sectionId: 'why_choose_us',
        name: { en: 'Why Choose Us', ar: 'لماذا تختارنا' },
        description: 'Supermarket stats and why choose us section',
        sortOrder: 1,
        isActive: true,
        settings: {
          showStats: true,
          showButtons: true
        },
        content: {
          title: { en: 'Why Choose SAPT Markets?', ar: 'لماذا تختار أسواق سابت؟' },
          subtitle: { en: "Saudi Arabia's Leading Online Supermarket", ar: 'السوبرماركت الإلكتروني الرائد في المملكة العربية السعودية' },
          description: { en: 'Discover thousands of premium products across all categories — from fresh produce to household essentials — all at competitive prices with unmatched convenience.', ar: 'اكتشف آلاف المنتجات المتميزة عبر جميع الفئات - من المنتجات الطازجة إلى الضروريات المنزلية - كل ذلك بأسعار تنافسية مع راحة لا مثيل لها.' },
          stats: [
            { value: 'Thousands of', label: ' Satisfied Customers' },
            { value: ' Exclusive', label: ' Product Range' },
            { value: '24/7', label: 'Customer Support Excellence' },
            { value: '4.8/5', label: 'Average Customer Rating' }
          ]
        }
      },
      {
        sectionId: 'categories',
        name: { en: 'Categories', ar: 'الفئات' },
        description: 'Product categories carousel',
        sortOrder: 2,
        isActive: true,
        settings: {
          showAllProductsCard: true,
          showCarouselNavigation: true
        },
        content: {
          title: { en: 'Shop by Category', ar: 'تسوق حسب الفئة' },
          description: { en: 'Explore our comprehensive selection — organized for your convenience. Browse through carefully curated categories to find exactly what you need, faster.', ar: 'اكتشف تشكيلتنا الشاملة - منظمة لراحتك. تصفح الفئات المنسقة بعناية للعثور على ما تحتاجه بالضبط، بشكل أسرع.' }
        }
      },
      {
        sectionId: 'special_prices',
        name: { en: 'Special Prices', ar: 'أسعار خاصة' },
        description: 'Fixed price promotions section',
        sortOrder: 3,
        isActive: true,
        settings: {
          maxItems: 8,
          showViewAll: true
        },
        content: {
          title: { en: 'Special Prices', ar: 'أسعار خاصة' },
          description: { en: 'Amazing fixed price deals on selected products', ar: 'صفقات بأسعار ثابتة مذهلة على منتجات مختارة' }
        }
      },
      {
        sectionId: 'combo_deals',
        name: { en: 'Combo Deals', ar: 'عروض الباقات' },
        description: 'Combo deals and assorted items section',
        sortOrder: 4,
        isActive: true,
        settings: {
          maxItems: 3,
          showViewAll: true
        },
        content: {
          title: { en: 'Combo Deals', ar: 'عروض الباقات' },
          description: { en: 'Mix and match deals - Get more for less!', ar: 'صفقات الخلط والمطابقة - احصل على المزيد مقابل أقل!' }
        }
      },
      {
        sectionId: 'featured_products',
        name: { en: 'Featured Products', ar: 'منتجات مميزة' },
        description: 'Premium featured products section',
        sortOrder: 5,
        isActive: true,
        settings: {
          maxItems: 50,
          cardVariant: 'simple',
          gridCols: 'lg:grid-cols-3'
        },
        content: {
          title: { en: 'Premium Selection', ar: 'تشكيلة متميزة' },
          description: { en: 'Our featured products with improved shopping experience', ar: 'منتجاتنا المميزة مع تجربة تسوق محسنة' },
          viewAllLink: '/products'
        }
      },
      {
        sectionId: 'popular_products',
        name: { en: 'Popular Products', ar: 'منتجات شائعة' },
        description: 'Most popular products section',
        sortOrder: 6,
        isActive: true,
        settings: {
          cardVariant: 'simple',
          gridCols: 'lg:grid-cols-3'
        },
        content: {
          title: { en: 'Popular Products', ar: 'منتجات شائعة' },
          description: { en: 'Most popular products based on sales', ar: 'أكثر المنتجات شعبية بناءً على المبيعات' },
          viewAllLink: '/products'
        }
      },
      {
        sectionId: 'banner_section',
        name: { en: 'Mid Banner', ar: 'بانر وسطي' },
        description: 'Middle banner section',
        sortOrder: 7,
        isActive: true,
        settings: {
          managedBy: 'banners',
          bannerLocation: 'home-middle'
        },
        content: {
          title: { en: 'Special Offers Just For You', ar: 'عروض خاصة لك فقط' },
          description: { en: 'Discover amazing deals on our freshest products. Limited time offers available now!', ar: 'اكتشف صفقات مذهلة على منتجاتنا الأكثر طزاجة. عروض لفترة محدودة متاحة الآن!' },
          buttonText: { en: 'Shop Now', ar: 'تسوق الآن' },
          buttonLink: '/offer'
        }
      },
      {
        sectionId: 'discount_products',
        name: { en: 'Special Discounts', ar: 'خصومات خاصة' },
        description: 'Discounted products section',
        sortOrder: 8,
        isActive: true,
        settings: {
          cardVariant: 'simple',
          gridCols: 'lg:grid-cols-3'
        },
        content: {
          title: { en: 'Special Discounts', ar: 'خصومات خاصة' },
          description: { en: 'Products with special discounts just for you', ar: 'منتجات مع خصومات خاصة لك فقط' },
          viewAllLink: '/offer'
        }
      },
      {
        sectionId: 'trust_features',
        name: { en: 'Trust Features', ar: 'مميزات الثقة' },
        description: 'Trust and service features section',
        sortOrder: 9,
        isActive: true,
        settings: {
          showIcons: true
        },
        content: {
          title: { en: 'The SAPT Markets Advantage', ar: 'مميزات أسواق سابت' },
          description: { en: 'Experience the difference with our premium service standards', ar: 'اختبر الفرق مع معايير خدمتنا المتميزة' },
          features: [
            {
              title: { en: 'Free Same-Day Delivery', ar: 'توصيل مجاني في نفس اليوم' },
              description: { en: 'Order by 2 PM for same-day delivery — no minimum purchase required', ar: 'اطلب قبل الساعة 2 ظهراً للحصول على التوصيل في نفس اليوم - لا يوجد حد أدنى للشراء' }
            },
            {
              title: { en: 'Secure Payment Gateway', ar: 'بوابة دفع آمنة' },
              description: { en: 'Your financial information is protected with bank-grade encryption', ar: 'معلوماتك المالية محمية بتشفير بمستوى البنوك' }
            },
            {
              title: { en: 'Expert Customer Support', ar: 'دعم عملاء خبير' },
              description: { en: 'Reach our knowledgeable team via chat, phone, or email — 24/7', ar: 'تواصل مع فريقنا الخبير عبر الدردشة أو الهاتف أو البريد الإلكتروني - 24/7' }
            },
            {
              title: { en: 'Freshness Guarantee', ar: 'ضمان الطزاجة' },
              description: { en: '100% satisfaction promise — fresh products or full refund', ar: 'وعد رضا 100% - منتجات طازجة أو استرداد كامل' }
            },
            {
              title: { en: 'Premium Quality Standards', ar: 'معايير جودة متميزة' },
              description: { en: 'Rigorous quality checks ensure only the best products reach you', ar: 'فحوصات جودة صارمة تضمن وصول أفضل المنتجات إليك فقط' }
            },
            {
              title: { en: 'User-Friendly Shopping', ar: 'تسوق سهل الاستخدام' },
              description: { en: 'Intuitive interface designed for effortless browsing and purchasing', ar: 'واجهة بديهية مصممة للتصفح والشراء بدون جهد' }
            }
          ]
        }
      },
      {
        sectionId: 'testimonials',
        name: { en: 'Testimonials', ar: 'شهادات العملاء' },
        description: 'Customer testimonials section',
        sortOrder: 10,
        isActive: true,
        settings: {
          showCarousel: true,
          autoPlay: true
        },
        content: {
          title: { en: 'What Our Customers Say', ar: 'ما يقوله عملاؤنا' },
          description: { en: 'Real reviews from satisfied shoppers across Saudi Arabia', ar: 'مراجعات حقيقية من متسوقين راضين في جميع أنحاء المملكة العربية السعودية' },
          testimonials: [
            {
              name: 'Sarah Al-Mahmoud',
              location: 'Riyadh',
              rating: 5,
              text: 'Outstanding quality and lightning-fast delivery! SAPT Markets has completely changed how I shop for groceries. The produce is always fresh, and the convenience is unmatched.',
              image: 'https://randomuser.me/api/portraits/women/1.jpg'
            },
            {
              name: 'Ahmed Al-Rashid',
              location: 'Jeddah',
              rating: 5,
              text: 'Been using SAPT Markets for over a year now. The customer service is exceptional, and I love the variety of products available. Highly recommend to everyone!',
              image: 'https://randomuser.me/api/portraits/men/1.jpg'
            },
            {
              name: 'Fatima Al-Zahra',
              location: 'Dammam',
              rating: 5,
              text: 'The mobile app is so user-friendly, and the delivery team is always professional. SAPT Markets has made grocery shopping stress-free for our entire family.',
              image: 'https://randomuser.me/api/portraits/women/2.jpg'
            }
          ]
        }
      },
      {
        sectionId: 'newsletter',
        name: { en: 'Newsletter', ar: 'النشرة الإخبارية' },
        description: 'Newsletter subscription section',
        sortOrder: 11,
        isActive: true,
        settings: {
          showBackground: true
        },
        content: {
          title: { en: 'Stay Updated', ar: 'ابق على اطلاع' },
          description: { en: 'Subscribe to our newsletter for the latest offers and updates', ar: 'اشترك في نشرتنا الإخبارية للحصول على أحدث العروض والتحديثات' },
          buttonText: { en: 'Subscribe', ar: 'اشترك' },
          placeholderText: { en: 'Enter your email address', ar: 'أدخل عنوان بريدك الإلكتروني' },
          benefits: [
            {
              text: { en: "Weekly exclusive discount codes", ar: "رموز خصم حصرية أسبوعية" },
              iconType: "tag"
            },
            {
              text: { en: "Early access to seasonal sales", ar: "وصول مبكر للمبيعات الموسمية" },
              iconType: "clock"
            },
            {
              text: { en: "New product launch notifications", ar: "إشعارات إطلاق منتجات جديدة" },
              iconType: "bell"
            },
            {
              text: { en: "Personalized recommendations", ar: "توصيات شخصية" },
              iconType: "user"
            }
          ]
        }
      }
    ];

    // Initialize sections if they don't exist
    for (const section of defaultSections) {
      await HomepageSection.findOneAndUpdate(
        { sectionId: section.sectionId },
        section,
        { upsert: true, new: true }
      );
    }

    const sections = await HomepageSection.find({}).sort({ sortOrder: 1 });

    res.send({
      data: sections,
      message: "Default sections initialized successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  getAllSections: getAllHomepageSections,
  getActiveSections: getActiveHomepageSections,
  getSectionById: getHomepageSection,
  updateSection: updateHomepageSection,
  toggleSection: toggleSectionVisibility,
  initializeSections: initializeDefaultSections,
  updateSectionsOrder,
  cleanupDuplicates: async (req, res) => {
    try {
      // Remove duplicate sections based on sectionId
      const sections = await HomepageSection.find({});
      const seen = new Set();
      const duplicates = [];
      
      for (const section of sections) {
        if (seen.has(section.sectionId)) {
          duplicates.push(section._id);
        } else {
          seen.add(section.sectionId);
        }
      }
      
      if (duplicates.length > 0) {
        await HomepageSection.deleteMany({ _id: { $in: duplicates } });
      }
      
      res.send({
        message: `Cleaned up ${duplicates.length} duplicate sections`,
        removedCount: duplicates.length
      });
    } catch (err) {
      res.status(500).send({
        message: err.message,
      });
    }
  }
}; 