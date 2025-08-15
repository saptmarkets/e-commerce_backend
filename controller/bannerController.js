const Banner = require("../models/Banner");

const bannerController = {
  // Add new banner
  addBanner: async (req, res) => {
    try {
      const {
        title,
        titleAr,
        description,
        descriptionAr,
        imageUrl,
        leftImageUrl,
        rightImageUrl,
        leftImageUrl1,
        leftImageUrl2,
        rightImageUrl1,
        rightImageUrl2,
        location,
        linkUrl,
        linkText,
        linkTextAr,
        openInNewTab,
        status,
        sortOrder,
        startDate,
        endDate,
        layoutType,
        leftImageAnimation,
        rightImageAnimation,
        centerImageAnimation
      } = req.body;

      // Check if banner location has reached its maximum limit
      const locationBannerCount = await Banner.countDocuments({ 
        location, 
        status: { $in: ['active', 'scheduled'] } 
      });

      const locationLimits = {
        'home-hero': 10, // Increased to allow more banners for triple layout testing
        'home-middle': 1,
        'products-hero': 3,
        'category-top': 1,
        'promotions-hero': 2,
        'page-header': 10,
        'sidebar-ads': 5,
        'footer-banner': 1
      };

      if (locationBannerCount >= locationLimits[location]) {
        return res.status(400).json({
          message: `Maximum ${locationLimits[location]} banners allowed for ${location}`,
        });
      }

      const newBanner = new Banner({
        title,
        titleAr,
        description,
        descriptionAr,
        imageUrl,
        leftImageUrl: leftImageUrl || null,
        rightImageUrl: rightImageUrl || null,
        leftImageUrl1: leftImageUrl1 || null,
        leftImageUrl2: leftImageUrl2 || null,
        rightImageUrl1: rightImageUrl1 || null,
        rightImageUrl2: rightImageUrl2 || null,
        location,
        linkUrl,
        linkText,
        linkTextAr,
        openInNewTab: openInNewTab || false,
        status: status || 'active',
        sortOrder: parseInt(sortOrder) || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        layoutType: layoutType || 'single',
        leftImageAnimation: leftImageAnimation || 'slideUp',
        rightImageAnimation: rightImageAnimation || 'slideUp',
        centerImageAnimation: centerImageAnimation || 'slideRight',
        textAlignment: {
          en: req.body.textAlignment?.en || 'left',
          ar: req.body.textAlignment?.ar || 'right'
        }
      });

      await newBanner.save();

      res.status(201).json({
        message: "Banner created successfully!",
        banner: newBanner,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Get all banners with pagination
  getAllBanners: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 8,
        title,
        location,
        status,
        sort = 'createdAt'
      } = req.query;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      // Build search query
      let query = {};
      
      if (title) {
        query.$or = [
          { title: { $regex: title, $options: "i" } },
          { titleAr: { $regex: title, $options: "i" } },
          { description: { $regex: title, $options: "i" } },
          { descriptionAr: { $regex: title, $options: "i" } }
        ];
      }
      
      if (location && location !== 'all') {
        query.location = location;
      }
      
      if (status && status !== 'all') {
        query.status = status;
      }

      // Build sort query
      let sortQuery = {};
      if (sort === 'title') {
        sortQuery = { title: 1 };
      } else if (sort === 'location') {
        sortQuery = { location: 1, sortOrder: 1 };
      } else if (sort === 'status') {
        sortQuery = { status: 1 };
      } else {
        sortQuery = { createdAt: -1 };
      }

      const totalDoc = await Banner.countDocuments(query);
      
      const banners = await Banner.find(query)
        .sort(sortQuery)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

      res.json({
        banners,
        totalDoc,
        limit: limitNumber,
        page: pageNumber,
        pages: Math.ceil(totalDoc / limitNumber),
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Get banner by ID
  getBannerById: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      res.json(banner);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Update banner
  updateBanner: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      const updatedBanner = await Banner.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          sortOrder: parseInt(req.body.sortOrder) || banner.sortOrder,
          openInNewTab: req.body.openInNewTab || false,
          startDate: req.body.startDate || null,
          endDate: req.body.endDate || null,
          leftImageUrl: req.body.leftImageUrl || null,
          rightImageUrl: req.body.rightImageUrl || null,
          leftImageUrl1: req.body.leftImageUrl1 || null,
          leftImageUrl2: req.body.leftImageUrl2 || null,
          rightImageUrl1: req.body.rightImageUrl1 || null,
          rightImageUrl2: req.body.rightImageUrl2 || null,
          layoutType: req.body.layoutType || banner.layoutType || 'single',
          leftImageAnimation: req.body.leftImageAnimation || banner.leftImageAnimation || 'slideUp',
          rightImageAnimation: req.body.rightImageAnimation || banner.rightImageAnimation || 'slideUp',
          centerImageAnimation: req.body.centerImageAnimation || banner.centerImageAnimation || 'slideRight'
        },
        { new: true }
      );

      res.json({
        message: "Banner updated successfully!",
        banner: updatedBanner,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Delete banner
  deleteBanner: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      await Banner.findByIdAndDelete(req.params.id);

      res.json({
        message: "Banner deleted successfully!",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Delete many banners
  deleteManyBanners: async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          message: "Please provide banner IDs to delete",
        });
      }

      await Banner.deleteMany({ _id: { $in: ids } });

      res.json({
        message: `${ids.length} banner(s) deleted successfully!`,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Update banner status
  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!['active', 'inactive', 'scheduled'].includes(status)) {
        return res.status(400).json({
          message: "Invalid status value",
        });
      }

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      res.json({
        message: "Banner status updated successfully!",
        banner,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Update sort order for multiple banners
  updateSortOrder: async (req, res) => {
    try {
      const { banners } = req.body;
      
      if (!banners || !Array.isArray(banners)) {
        return res.status(400).json({
          message: "Please provide banners array with id and sortOrder",
        });
      }

      // Update each banner's sort order
      const updatePromises = banners.map(({ id, sortOrder }) =>
        Banner.findByIdAndUpdate(id, { sortOrder: parseInt(sortOrder) })
      );

      await Promise.all(updatePromises);

      res.json({
        message: "Banner sort order updated successfully!",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Get banners by location (for frontend)
  getBannersByLocation: async (req, res) => {
    try {
      const { location } = req.params;
      const query = {
        location: location,
        status: 'active',
        $or: [
          { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } },
          { startDate: null, endDate: null },
        ],
      };
      const banners = await Banner.find(query).sort({ sortOrder: 1 });

      // Return consistent response structure
      res.json({
        success: true,
        banners: banners,
        count: banners.length
      });
    } catch (err) {
      console.error("Error in getBannersByLocation:", err);
      res.status(500).json({
        success: false,
        message: "Error getting banners by location",
        error: err.message,
      });
    }
  },

  // Get all active banners (for frontend)
  getActiveBanners: async (req, res) => {
    try {
      const banners = await Banner.getAllActive();

      // Group banners by location
      const bannersByLocation = banners.reduce((acc, banner) => {
        if (!acc[banner.location]) {
          acc[banner.location] = [];
        }
        acc[banner.location].push(banner);
        return acc;
      }, {});

      res.json({
        banners: bannersByLocation,
        totalCount: banners.length,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Track banner click
  trackBannerClick: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      await banner.incrementClick();

      res.json({
        message: "Click tracked successfully!",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Track banner impression
  trackBannerImpression: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      
      if (!banner) {
        return res.status(404).json({
          message: "Banner not found!",
        });
      }

      await banner.incrementImpression();

      res.json({
        message: "Impression tracked successfully!",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },

  // Get banner analytics
  getBannerAnalytics: async (req, res) => {
    try {
      const { startDate, endDate, location } = req.query;
      
      let query = {};
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (location && location !== 'all') {
        query.location = location;
      }

      const banners = await Banner.find(query);
      
      const analytics = {
        totalBanners: banners.length,
        totalClicks: banners.reduce((sum, banner) => sum + banner.clickCount, 0),
        totalImpressions: banners.reduce((sum, banner) => sum + banner.impressionCount, 0),
        byLocation: {},
        byStatus: {
          active: 0,
          inactive: 0,
          scheduled: 0
        }
      };

      // Group analytics by location
      banners.forEach(banner => {
        if (!analytics.byLocation[banner.location]) {
          analytics.byLocation[banner.location] = {
            count: 0,
            clicks: 0,
            impressions: 0
          };
        }
        
        analytics.byLocation[banner.location].count++;
        analytics.byLocation[banner.location].clicks += banner.clickCount;
        analytics.byLocation[banner.location].impressions += banner.impressionCount;
        
        analytics.byStatus[banner.status]++;
      });

      // Calculate CTR (Click Through Rate)
      analytics.ctr = analytics.totalImpressions > 0 
        ? ((analytics.totalClicks / analytics.totalImpressions) * 100).toFixed(2)
        : 0;

      res.json(analytics);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
};

module.exports = bannerController;