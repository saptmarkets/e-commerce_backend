const express = require("express");
const router = express.Router();
const bannerController = require("../controller/bannerController");
const { isAuth, isAdmin } = require("../config/auth");

// Admin routes (with authentication middleware)
router.post("/admin/banners", isAuth, isAdmin, bannerController.addBanner);
router.get("/admin/banners", isAuth, isAdmin, bannerController.getAllBanners);
router.get("/admin/banners/analytics", isAuth, isAdmin, bannerController.getBannerAnalytics);
router.patch("/admin/banners/delete/many", isAuth, isAdmin, bannerController.deleteManyBanners);
router.patch("/admin/banners/sort-order", isAuth, isAdmin, bannerController.updateSortOrder);
router.get("/admin/banners/:id", isAuth, isAdmin, bannerController.getBannerById);
router.put("/admin/banners/:id", isAuth, isAdmin, bannerController.updateBanner);
router.delete("/admin/banners/:id", isAuth, isAdmin, bannerController.deleteBanner);
router.put("/admin/banners/status/:id", isAuth, isAdmin, bannerController.updateStatus);

// Public routes (for frontend)
router.get("/banners/location/:location", bannerController.getBannersByLocation);
router.get("/banners/active", bannerController.getActiveBanners);
router.post("/banners/track/click/:id", bannerController.trackBannerClick);
router.post("/banners/track/impression/:id", bannerController.trackBannerImpression);

// Backward compatible short paths when mounted at /api/banner or /api/banners
router.get("/location/:location", bannerController.getBannersByLocation);
router.get("/active", bannerController.getActiveBanners);
router.post("/track/click/:id", bannerController.trackBannerClick);
router.post("/track/impression/:id", bannerController.trackBannerImpression);

module.exports = router; 