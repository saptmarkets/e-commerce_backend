const express = require("express");
const router = express.Router();
const {
  addPromotion,
  getAllPromotions,
  getActivePromotions,
  getPromotionById,
  getPromotionsByProduct,
  getPromotionsByProductUnit,
  updatePromotion,
  deletePromotion,
  deleteManyPromotions,
  updatePromotionStatus,
} = require("../controller/promotionController");

// Add a new promotion
router.post("/", addPromotion);

// Get all promotions with pagination
router.get("/", getAllPromotions);

// Get active promotions for store display
router.get("/active", getActivePromotions);

// Get a promotion by ID
router.get("/:id", getPromotionById);

// Get promotions by product ID
router.get("/product/:productId", getPromotionsByProduct);

// Get promotions by product unit ID
router.get("/product-unit/:productUnitId", getPromotionsByProductUnit);

// Update a promotion
router.put("/:id", updatePromotion);

// Update promotion status
router.put("/status/:id", updatePromotionStatus);

// Delete a promotion
router.delete("/:id", deletePromotion);

// Delete multiple promotions
router.delete("/bulk/delete", deleteManyPromotions);

module.exports = router; 