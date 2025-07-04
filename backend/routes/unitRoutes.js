const express = require("express");
const router = express.Router();
const {
  addUnit,
  getAllUnits,
  getUnitsGrouped,
  getUnitsByBasicType,
  getMultiUnits,
  getBasicUnits,
  getCompatibleUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  updateUnitStatus,
  getShowingUnits,
} = require("../controller/unitController");

// Add a new unit
router.post("/", addUnit);

// Get all units
router.get("/", getAllUnits);

// Get units grouped by basic type
router.get("/grouped", getUnitsGrouped);

// Get basic units only
router.get("/basic", getBasicUnits);

// Get units by basic type
router.get("/type/:basicType", getUnitsByBasicType);

// Get multi-units for a parent unit
router.get("/multi/:parentUnitId", getMultiUnits);

// Get compatible units for a basic unit (includes basic unit + its children)
router.get("/compatible/:basicUnitId", getCompatibleUnits);

// Get all showing units
router.get("/show", getShowingUnits);

// Get unit by ID
router.get("/:id", getUnitById);

// Update unit
router.put("/:id", updateUnit);

// Update unit status
router.put("/status/:id", updateUnitStatus);

// Delete unit
router.delete("/:id", deleteUnit);

module.exports = router; 