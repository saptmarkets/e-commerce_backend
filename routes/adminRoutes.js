const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  forgetPassword,
  resetPassword,
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  updatedStatus,
} = require("../controller/adminController");

// Import banner controller for admin banner management
const bannerController = require("../controller/bannerController");
const { passwordVerificationLimit } = require("../lib/email-sender/sender");
const { isAuth, handleDecryptData } = require("../config/auth");

//register a staff
router.post("/register", registerAdmin);

//login a admin
router.post("/login", loginAdmin);

//forget-password
router.put("/forget-password", passwordVerificationLimit, forgetPassword);

//reset-password
router.put("/reset-password", resetPassword);

//add a staff
router.post("/add", isAuth, addStaff);

//get all staff
router.get("/staff", isAuth, getAllStaff);

//get a staff
router.get("/staff/:id", isAuth, getStaffById);

//update a staff
router.put("/staff/:id", isAuth, updateStaff);

//update staf status
router.put("/update-status/:id", isAuth, updatedStatus);

//delete a staff
router.delete("/staff/:id", isAuth, deleteStaff);

// Banner management routes
router.get("/banners", isAuth, bannerController.getAllBanners);
router.post("/banners", isAuth, bannerController.addBanner);
router.get("/banners/:id", isAuth, bannerController.getBannerById);
router.put("/banners/:id", isAuth, bannerController.updateBanner);
router.delete("/banners/:id", isAuth, bannerController.deleteBanner);
router.patch("/banners/delete/many", isAuth, bannerController.deleteManyBanners);
router.patch("/banners/sort-order", isAuth, bannerController.updateSortOrder);
router.put("/banners/status/:id", isAuth, bannerController.updateStatus);
router.get("/banners/analytics", isAuth, bannerController.getBannerAnalytics);

// Decrypt data
router.post("/decrypt", isAuth, async (req, res) => {
  try {
    const { encryptedData, iv } = req.body;
    
    // Convert base64 back to hex
    const encryptedHex = Buffer.from(encryptedData, 'base64').toString('hex');
    const ivHex = Buffer.from(iv, 'base64').toString('hex');
    
    // Use the handleDecryptData function from auth.js
    const decryptedData = handleDecryptData(encryptedHex, ivHex);
    
    if (decryptedData === null) {
      throw new Error('Decryption failed');
    }
    
    res.json({ decryptedData: JSON.stringify(decryptedData) });
  } catch (error) {
    console.error('Decryption error:', error);
    res.status(500).json({ error: 'Decryption failed' });
  }
});

module.exports = router;
