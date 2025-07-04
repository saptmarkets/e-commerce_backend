const HomepageSection = require('../models/HomepageSection');

// Get all sections for admin
const getAllSections = async (req, res) => {
  try {
    let sections = await HomepageSection.find({}).sort({ sortOrder: 1 });

    // Auto-create Social Links section if it doesn't exist (helps existing stores upgrade smoothly)
    const hasSocialLinks = sections.find(s => s.sectionId === 'social_links');
    if (!hasSocialLinks) {
      const socialSection = await HomepageSection.create({
        sectionId: 'social_links',
        name: { en: 'Social & Store Info', ar: 'روابط التواصل ومعلومات المتجر' },
        description: 'Social media buttons and store contact information',
        isActive: true,
        sortOrder: sections.length, // append at end
        content: {
          title: { en: 'Connect With Us', ar: 'تواصل معنا' },
          description: { en: 'Follow us on social media and reach out any time', ar: 'تابعنا على وسائل التواصل الاجتماعي وتواصل معنا في أي وقت' },
          links: [],
          contact: {
            phone: '',
            email: '',
            address: { en: '', ar: '' }
          }
        },
        settings: {}
      });
      sections.push(socialSection);
    }

    res.json(sections);
  } catch (error) {
    console.error('Get all sections error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sections',
      error: error.message 
    });
  }
};

// Get active sections for customer app
const getActiveSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json(sections);
  } catch (error) {
    console.error('Get active sections error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch active sections',
      error: error.message 
    });
  }
};

// Get single section by ID
const getSectionById = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await HomepageSection.findOne({ sectionId });
    
    if (!section) {
      return res.status(404).json({ 
        success: false, 
        message: 'Section not found' 
      });
    }
    
    res.json(section);
  } catch (error) {
    console.error('Get section by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch section',
      error: error.message 
    });
  }
};

// Update section
const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const updateData = req.body;
    
    const section = await HomepageSection.findOneAndUpdate(
      { sectionId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!section) {
      return res.status(404).json({ 
        success: false, 
        message: 'Section not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Section updated successfully',
      section
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update section',
      error: error.message 
    });
  }
};

// Toggle section active/inactive
const toggleSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { isActive } = req.body;
    
    const section = await HomepageSection.findOneAndUpdate(
      { sectionId },
      { isActive },
      { new: true }
    );
    
    if (!section) {
      return res.status(404).json({ 
        success: false, 
        message: 'Section not found' 
      });
    }
    
    res.json({
      success: true,
      message: `Section ${isActive ? 'activated' : 'deactivated'} successfully`,
      section
    });
  } catch (error) {
    console.error('Toggle section error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle section',
      error: error.message 
    });
  }
};

// Initialize default sections
const initializeSections = async (req, res) => {
  try {
    const defaultSections = [
      {
        sectionId: 'hero',
        name: { en: 'Hero Section', ar: 'قسم البطل' },
        description: 'Main hero banner with call-to-action',
        isActive: true,
        sortOrder: 0,
        content: {},
        settings: {}
      },
      {
        sectionId: 'why_choose_us',
        name: { en: 'Why Choose Us', ar: 'لماذا تختارنا' },
        description: 'Highlight key benefits and features',
        isActive: true,
        sortOrder: 1,
        content: {},
        settings: {}
      },
      {
        sectionId: 'categories',
        name: { en: 'Shop by Category', ar: 'تسوق حسب الفئة' },
        description: 'Display product categories',
        isActive: true,
        sortOrder: 2,
        content: {
          title: { en: 'Shop by Category', ar: 'تسوق حسب الفئة' },
          description: { en: 'Explore our comprehensive selection — organized for your convenience.', ar: 'استكشف مجموعتنا الشاملة — منظمة لراحتك.' }
        },
        settings: {}
      },
      {
        sectionId: 'special_prices',
        name: { en: 'Special Prices', ar: 'أسعار خاصة' },
        description: 'Products with special pricing',
        isActive: true,
        sortOrder: 3,
        content: {
          title: { en: 'Special Prices', ar: 'أسعار خاصة' },
          description: { en: 'Limited time offers on selected products', ar: 'عروض محدودة الوقت على منتجات مختارة' }
        },
        settings: { maxItems: 8 }
      },
      {
        sectionId: 'combo_deals',
        name: { en: 'Combo Deals', ar: 'عروض الكومبو' },
        description: 'Bundle deals and combo offers',
        isActive: true,
        sortOrder: 4,
        content: {
          title: { en: 'Combo Deals', ar: 'عروض الكومبو' },
          description: { en: 'Save more with our combo packages', ar: 'وفر أكثر مع باقات الكومبو لدينا' }
        },
        settings: { maxItems: 6 }
      },
      {
        sectionId: 'featured_products',
        name: { en: 'Featured Products', ar: 'المنتجات المميزة' },
        description: 'Showcase featured products',
        isActive: true,
        sortOrder: 5,
        content: {
          title: { en: 'Featured Products', ar: 'المنتجات المميزة' },
          description: { en: 'Discover our handpicked selection of premium products', ar: 'اكتشف مجموعتنا المختارة بعناية من المنتجات المميزة' },
          viewAllLink: '/products?featured=true'
        },
        settings: { maxItems: 8, cardVariant: 'detailed', gridCols: 'lg:grid-cols-4' }
      },
      {
        sectionId: 'popular_products',
        name: { en: 'Popular Products', ar: 'المنتجات الشائعة' },
        description: 'Most popular products',
        isActive: true,
        sortOrder: 6,
        content: {
          title: { en: 'Popular Products', ar: 'المنتجات الشائعة' },
          description: { en: 'Customer favorites and bestsellers', ar: 'المفضلة لدى العملاء والأكثر مبيعاً' },
          viewAllLink: '/products?popular=true'
        },
        settings: { maxItems: 8, cardVariant: 'simple', gridCols: 'lg:grid-cols-4' }
      },
      {
        sectionId: 'banner_section',
        name: { en: 'Banner Section', ar: 'قسم البانر' },
        description: 'Promotional banner with call-to-action',
        isActive: true,
        sortOrder: 7,
        content: {
          title: { en: 'Special Offer', ar: 'عرض خاص' },
          description: { en: 'Don\'t miss out on our amazing deals', ar: 'لا تفوت عروضنا المذهلة' },
          buttonText: { en: 'Shop Now', ar: 'تسوق الآن' },
          buttonLink: '/products'
        },
        settings: {}
      },
      {
        sectionId: 'discount_products',
        name: { en: 'Discount Products', ar: 'منتجات مخفضة' },
        description: 'Products with discounts',
        isActive: true,
        sortOrder: 8,
        content: {
          title: { en: 'Discount Products', ar: 'منتجات مخفضة' },
          description: { en: 'Great savings on quality products', ar: 'توفير كبير على منتجات عالية الجودة' },
          viewAllLink: '/products?discount=true'
        },
        settings: { maxItems: 6, cardVariant: 'detailed', gridCols: 'lg:grid-cols-3' }
      },
      {
        sectionId: 'trust_features',
        name: { en: 'Trust Features', ar: 'ميزات الثقة' },
        description: 'Trust indicators and guarantees',
        isActive: true,
        sortOrder: 9,
        content: {
          title: { en: 'The SAPT Markets Advantage', ar: 'ميزة أسواق سابت' },
          description: { en: 'Experience the difference with our premium service standards', ar: 'اختبر الفرق مع معايير الخدمة المميزة لدينا' }
        },
        settings: {}
      },
      {
        sectionId: 'testimonials',
        name: { en: 'Customer Testimonials', ar: 'شهادات العملاء' },
        description: 'Customer reviews and testimonials',
        isActive: true,
        sortOrder: 10,
        content: {
          title: { en: 'What Our Customers Say', ar: 'ماذا يقول عملاؤنا' },
          description: { en: 'Real reviews from satisfied shoppers across Saudi Arabia', ar: 'مراجعات حقيقية من متسوقين راضين في جميع أنحاء المملكة العربية السعودية' }
        },
        settings: {}
      },
      {
        sectionId: 'newsletter',
        name: { en: 'Newsletter Signup', ar: 'اشتراك النشرة الإخبارية' },
        description: 'Email newsletter subscription',
        isActive: true,
        sortOrder: 11,
        content: {
          title: { en: 'Stay Updated', ar: 'ابق على اطلاع' },
          description: { en: 'Subscribe to get the latest offers and updates', ar: 'اشترك للحصول على أحدث العروض والتحديثات' },
          buttonText: { en: 'Subscribe', ar: 'اشترك' },
          placeholderText: { en: 'Enter your email address', ar: 'أدخل عنوان بريدك الإلكتروني' }
        },
        settings: {}
      },
      {
        sectionId: 'social_links',
        name: { en: 'Social & Store Info', ar: 'روابط التواصل ومعلومات المتجر' },
        description: 'Social media buttons and store contact information',
        isActive: true,
        sortOrder: 12,
        content: {
          title: { en: 'Connect With Us', ar: 'تواصل معنا' },
          description: { en: 'Follow us on social media and reach out any time', ar: 'تابعنا على وسائل التواصل الاجتماعي وتواصل معنا في أي وقت' },
          links: [
            { iconType: 'facebook', label: { en: 'Facebook', ar: 'فيسبوك' }, url: 'https://facebook.com/' },
            { iconType: 'instagram', label: { en: 'Instagram', ar: 'انستغرام' }, url: 'https://instagram.com/' }
          ],
          contact: {
            phone: '+966-5-0000-0000',
            email: 'info@example.com',
            address: { en: 'Riyadh, Saudi Arabia', ar: 'الرياض، المملكة العربية السعودية' }
          }
        },
        settings: {}
      }
    ];

    // Check if sections already exist
    const existingCount = await HomepageSection.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Sections already initialized',
        count: existingCount
      });
    }

    // Create default sections
    const createdSections = await HomepageSection.insertMany(defaultSections);

    res.json({
      success: true,
      message: 'Default sections created successfully',
      count: createdSections.length,
      sections: createdSections
    });
  } catch (error) {
    console.error('Initialize sections error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize sections',
      error: error.message 
    });
  }
};

// Update sections order
const updateSectionsOrder = async (req, res) => {
  try {
    const { sections } = req.body;
    
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sections array is required' 
      });
    }

    // Update each section's sortOrder
    const updatePromises = sections.map(({ sectionId, sortOrder }) => 
      HomepageSection.findOneAndUpdate(
        { sectionId },
        { sortOrder },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Section order updated successfully'
    });
  } catch (error) {
    console.error('Update sections order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update sections order',
      error: error.message 
    });
  }
};

// Clean up duplicate sections
const cleanupDuplicates = async (req, res) => {
  try {
    // Get all sections
    const allSections = await HomepageSection.find({});
    
    // Group by sectionId
    const sectionGroups = {};
    allSections.forEach(section => {
      if (!sectionGroups[section.sectionId]) {
        sectionGroups[section.sectionId] = [];
      }
      sectionGroups[section.sectionId].push(section);
    });

    let duplicatesRemoved = 0;

    // For each sectionId, keep only the first one and remove duplicates
    for (const sectionId in sectionGroups) {
      const sections = sectionGroups[sectionId];
      if (sections.length > 1) {
        // Sort by creation date and keep the first one
        sections.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const toKeep = sections[0];
        const toRemove = sections.slice(1);

        // Remove duplicates
        for (const duplicate of toRemove) {
          await HomepageSection.findByIdAndDelete(duplicate._id);
          duplicatesRemoved++;
        }
      }
    }

    res.json({
      success: true,
      message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate sections.`,
      duplicatesRemoved
    });
  } catch (error) {
    console.error('Cleanup duplicates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup duplicates',
      error: error.message 
    });
  }
};

module.exports = {
  getAllSections,
  getSectionById,
  updateSection,
  toggleSection,
  initializeSections,
  updateSectionsOrder,
  cleanupDuplicates,
  getActiveSections
}; 