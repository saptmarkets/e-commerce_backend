const express = require("express");
const router = express.Router();
const {
  addPromotionList,
  getAllPromotionLists,
  getActivePromotionLists,
  getPromotionListById,
  updatePromotionList,
  deletePromotionList,
  deleteManyPromotionLists,
  updatePromotionListStatus,
} = require("../controller/promotionListController");

// Add a new promotion list
router.post("/", addPromotionList);

// Get all promotion lists with pagination
router.get("/", getAllPromotionLists);

// Get active promotion lists for selection
router.get("/active", getActivePromotionLists);

// Get a promotion list by ID
router.get("/:id", getPromotionListById);

// Update a promotion list
router.put("/:id", updatePromotionList);

// Update promotion list status
router.put("/status/:id", updatePromotionListStatus);

// Delete a promotion list
router.delete("/:id", deletePromotionList);

// Delete multiple promotion lists
router.delete("/bulk/delete", deleteManyPromotionLists);

module.exports = router; 