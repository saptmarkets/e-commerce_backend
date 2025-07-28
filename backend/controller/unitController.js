const Unit = require("../models/Unit");

// Add a new unit
const addUnit = async (req, res) => {
  try {
    const { name, nameAr, shortCode, description, type, parentUnit: parentUnitId, packValue, status, isBase } = req.body;
    
    console.log('=== ADD UNIT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Extracted isBase:', isBase);
    console.log('Type of isBase:', typeof isBase);

    // Validate required fields
    if (!name || !shortCode) {
      return res.status(400).send({
        message: "Name and shortCode are required",
      });
    }

    // Check if unit name or shortCode already exists (case-insensitive)
    const existingUnit = await Unit.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { shortCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } }
      ]
    });

    if (existingUnit) {
      let message = "Unit with this name or short code already exists.";
      if (existingUnit.name.toLowerCase() === name.toLowerCase()) {
        message = "Unit name already exists.";
      } else if (existingUnit.shortCode.toLowerCase() === shortCode.toLowerCase()) {
        message = "Unit shortCode already exists.";
      }
      return res.status(400).send({ message });
    }

    const unitData = {
      name,
      nameAr: nameAr || "", // Arabic name is optional
      shortCode,
      description,
      type,
      status,
      isBase: isBase || false, // Handle isBase field
      isParent: true, // Default to parent
    };
    
    console.log('Unit data to save:', unitData);

    if (parentUnitId) {
      if (!packValue || parseFloat(packValue) <= 0) {
        return res.status(400).send({
          message: "Pack value is required and must be positive when specifying a parent unit.",
        });
      }
      const parent = await Unit.findById(parentUnitId);
      if (!parent) {
        return res.status(404).send({ message: "Parent unit not found." });
      }
      if (!parent.isParent && parent.parentUnit) { // Check if the intended parent is not itself a child of another
        return res.status(400).send({ message: "A child unit cannot be a parent. Please select a base unit as parent."});
      }
      unitData.parentUnit = parentUnitId;
      unitData.packValue = parseFloat(packValue);
      unitData.isParent = false; // Explicitly set to false if parent is provided
    } else {
      // For parent units, packValue is 1 (handled by pre-save hook, but can be explicit)
      unitData.packValue = 1;
    }

    const unit = new Unit(unitData);
    const savedUnit = await unit.save();
    const populatedUnit = await Unit.findById(savedUnit._id).populate('parentUnit', 'name shortCode');
    console.log('Saved unit:', populatedUnit);
    res.status(201).send(populatedUnit);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get all units
const getAllUnits = async (req, res) => {
  try {
    // Populating parentUnit to provide more context
    const units = await Unit.find({})
      .populate('parentUnit', 'name shortCode')
      .sort({ name: 1 }); // Simplified sort, can be adjusted
    res.send(units);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get units grouped by basic type (Legacy - review usefulness later)
const getUnitsGrouped = async (req, res) => {
  try {
    const units = await Unit.find({ status: 'show' })
      .populate('parentUnit', 'name shortCode')
      .sort({ basicType: 1, isParent: -1, sortOrder: 1 }); // sort to show parents first

    // Group units by basicType (legacy field)
    const groupedUnits = {};
    units.forEach(unit => {
      const key = unit.basicType || (unit.isParent ? unit.name : (unit.parentUnit ? unit.parentUnit.name : 'Other')); // Fallback grouping
      if (!groupedUnits[key]) {
        groupedUnits[key] = {
          groupName: key,
          parentUnitInfo: null,
          childUnitsList: []
        };
      }
      
      if (unit.isParent) {
        // If it's a parent, it might be the 'basicUnit' of the legacy structure
        groupedUnits[key].parentUnitInfo = unit; 
      } else if (unit.parentUnit && unit.parentUnit.name === key) {
         groupedUnits[key].childUnitsList.push(unit);
      } else {
        // Fallback for units that don't fit the primary grouping logic perfectly
        // This might happen if basicType is inconsistent or parentUnit is not the group key.
        // Or, if it is a child unit whose parent is not the key for this group
        // Add it to a generic list or its own parent's group if possible.
        if(unit.parentUnit){
            const parentKey = unit.parentUnit.name;
            if(!groupedUnits[parentKey]){
                 groupedUnits[parentKey] = { groupName: parentKey, parentUnitInfo: null, childUnitsList: [] };
            }
            if(groupedUnits[parentKey].parentUnitInfo === null && unit.parentUnit._id.equals(unit.parentUnit._id) ){ // Check if parentUnit itself is a parent
                 // This is a bit complex, ideally parentUnit would already be processed if it's a top-level parent
            }
            groupedUnits[parentKey].childUnitsList.push(unit);

        } else {
            // If no parent unit and not isParent, it's an orphan or ungrouped
             if (!groupedUnits['Orphaned/Ungrouped']) {
                groupedUnits['Orphaned/Ungrouped'] = { groupName: 'Orphaned/Ungrouped', parentUnitInfo: null, childUnitsList: [] };
            }
            groupedUnits['Orphaned/Ungrouped'].childUnitsList.push(unit);
        }
      }
    });
    
    // Refined grouping: ensure each group has the actual parent, and then its children.
    const result = [];
    const allParents = units.filter(u => u.isParent);
    const allChildren = units.filter(u => !u.isParent && u.parentUnit);

    allParents.forEach(p => {
        result.push({
            groupName: p.name,
            parentUnitInfo: p,
            childUnitsList: allChildren.filter(c => c.parentUnit && c.parentUnit._id.equals(p._id))
        });
    });
    
    // Add any children whose parents were not in the `allParents` list (orphans with parentId)
    const orphanedChildren = allChildren.filter(c => c.parentUnit && !allParents.find(p => p._id.equals(c.parentUnit._id)));
    if(orphanedChildren.length > 0){
        const orphanGroup = { groupName: "Orphaned Children", parentUnitInfo: null, childUnitsList: orphanedChildren};
        result.push(orphanGroup);
    }


    res.send(result);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get units by basic type (Legacy - uses static method)
const getUnitsByBasicType = async (req, res) => {
  try {
    const { basicType } = req.params;
    // The static method getByBasicType likely doesn't populate parentUnit.
    // Consider revising or ensuring population if this route is still heavily used.
    const units = await Unit.getByBasicType(basicType); 
    // Manual population if needed:
    // const populatedUnits = await Unit.populate(units, { path: 'parentUnit', select: 'name shortCode' });
    res.send(units);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get multi-units (children) for a parent unit
const getMultiUnits = async (req, res) => {
  try {
    const { parentUnitId } = req.params;
    // Static method getMultiUnits should ideally populate its own results if needed,
    // or we populate here. Assuming it doesn't, let's add population.
    const multiUnits = await Unit.getMultiUnits(parentUnitId)
                                .populate('parentUnit', 'name shortCode'); // Ensure parent is populated
    res.send(multiUnits);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get basic (parent) units only
const getBasicUnits = async (req, res) => {
  try {
    // Get basic units (parent units with isParent: true or isBase: true)
    const basicUnits = await Unit.find({
      $or: [
        { isParent: true },
        { isBase: true },
        { parentUnit: { $exists: false } },
        { parentUnit: null }
      ],
      status: "show"
    }).sort({ name: 1 });
    
    res.send(basicUnits);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get unit by ID
const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate('parentUnit', 'name shortCode');
    if (!unit) {
      return res.status(404).send({
        message: "Unit not found",
      });
    }
    res.send(unit);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update unit
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unitToUpdate = await Unit.findById(id);

    if (!unitToUpdate) {
      return res.status(404).send({ message: "Unit not found!" });
    }

    const { name, nameAr, shortCode, description, type, parentUnit: parentUnitId, packValue, status, isParent: isParentFlag, isBase } = req.body;
    
    console.log('=== UPDATE UNIT DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Extracted isBase:', isBase);
    console.log('Type of isBase:', typeof isBase);
    console.log('Current unit isBase:', unitToUpdate.isBase);

    // Check for uniqueness if name or shortCode are being changed
    if (name && name.toLowerCase() !== unitToUpdate.name.toLowerCase()) {
      const existing = await Unit.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, _id: { $ne: id } });
      if (existing) return res.status(400).send({ message: "Another unit with this name already exists." });
      unitToUpdate.name = name;
    }
    if (shortCode && shortCode.toLowerCase() !== unitToUpdate.shortCode.toLowerCase()) {
      const existing = await Unit.findOne({ shortCode: { $regex: new RegExp(`^${shortCode}$`, 'i') }, _id: { $ne: id } });
      if (existing) return res.status(400).send({ message: "Another unit with this short code already exists." });
      unitToUpdate.shortCode = shortCode;
    }

    if (description !== undefined) unitToUpdate.description = description;
    if (nameAr !== undefined) unitToUpdate.nameAr = nameAr || ""; // Arabic name is optional
    if (type !== undefined) unitToUpdate.type = type;
    if (status !== undefined) unitToUpdate.status = status;
    if (isBase !== undefined) {
      console.log('Setting isBase to:', isBase);
      unitToUpdate.isBase = isBase;
    }

    // Handling parent-child relationship update
    if (parentUnitId !== undefined) { // User is trying to set or change the parent
      if (parentUnitId === null || parentUnitId === '') { // Setting as a parent unit
        unitToUpdate.parentUnit = null;
        unitToUpdate.isParent = true;
        unitToUpdate.packValue = 1; // pre-save hook in model will also do this
      } else {
        // Trying to set a parent
        if (parentUnitId === id) { // Cannot be its own parent
            return res.status(400).send({ message: "Unit cannot be its own parent." });
        }
        if (!packValue || parseFloat(packValue) <= 0) {
          return res.status(400).send({ message: "Pack value is required and must be positive when specifying a parent unit." });
        }
        const parent = await Unit.findById(parentUnitId);
        if (!parent) return res.status(404).send({ message: "Chosen parent unit not found." });
        if (!parent.isParent && parent.parentUnit) {
             return res.status(400).send({ message: "A child unit cannot be a parent. Please select a base unit as parent."});
        }
        unitToUpdate.parentUnit = parentUnitId;
        unitToUpdate.packValue = parseFloat(packValue);
        unitToUpdate.isParent = false;
      }
    } else if (isParentFlag !== undefined && isParentFlag === true && unitToUpdate.parentUnit !== null) {
      // Explicitly making it a parent unit (if it was a child)
      unitToUpdate.parentUnit = null;
      unitToUpdate.isParent = true;
      unitToUpdate.packValue = 1;
    }
    // If parentUnitId is NOT in req.body, but packValue IS, and it's a child unit, update its packValue
    else if (packValue !== undefined && !unitToUpdate.isParent && unitToUpdate.parentUnit) {
        if(parseFloat(packValue) <= 0) return res.status(400).send({ message: "Pack value must be positive."});
        unitToUpdate.packValue = parseFloat(packValue);
    }


    const updatedUnit = await unitToUpdate.save();
    const populatedUnit = await Unit.findById(updatedUnit._id).populate('parentUnit', 'name shortCode');
    
    console.log('Updated unit isBase:', populatedUnit.isBase);
    console.log('Final updated unit:', populatedUnit);

    res.status(200).send({
      message: "Unit updated successfully",
      unit: populatedUnit,
    });

  } catch (err) {
    // Mongoose validation errors might come here
    if (err.name === 'ValidationError') {
        return res.status(400).send({ message: err.message });
    }
    res.status(500).send({ // Changed from 400 to 500 for generic server errors
      message: err.message,
    });
  }
};

// Delete unit
const deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.id;
    // Check if this unit is a parent to any other units
    const children = await Unit.find({ parentUnit: unitId });
    if (children.length > 0) {
      return res.status(400).send({
        message: "Cannot delete unit. It is a parent to other units. Please reassign or delete child units first.",
        childUnitIds: children.map(c => c._id)
      });
    }

    // TODO: Check if this unit is used in any Product.basicUnit or ProductUnit.unitId
    // This would require looking into Product and ProductUnit collections.
    // For now, proceeding with delete. Add checks if referential integrity is critical.

    await Unit.findByIdAndDelete(unitId);
    res.status(200).send({
      message: "Unit deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update unit status
const updateUnitStatus = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (unit) {
      const updatedUnit = await Unit.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      ).populate('parentUnit', 'name shortCode');
      res.status(200).send({
        message: `Unit status updated to ${req.body.status} successfully!`,
        unit: updatedUnit
      });
    } else {
      res.status(404).send({
        message: "Unit not found!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get all showing units (sorted by name)
const getShowingUnits = async (req, res) => {
  try {
    const units = await Unit.find({ status: "show" })
      .populate('parentUnit', 'name shortCode')
      .sort({ name: 1 });
    res.send(units);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get compatible units for a given basic unit (includes the basic unit itself and its children)
const getCompatibleUnits = async (req, res) => {
  try {
    const { basicUnitId } = req.params;
    
    if (!basicUnitId) {
      return res.status(400).send({
        message: "Basic unit ID is required",
      });
    }

    // Get the basic unit
    const basicUnit = await Unit.findById(basicUnitId);
    if (!basicUnit) {
      return res.status(404).send({
        message: "Basic unit not found",
      });
    }

    // If it's not a parent unit, return error
    if (!basicUnit.isParent) {
      return res.status(400).send({
        message: "Provided unit is not a basic (parent) unit",
      });
    }

    // Get all child units for this basic unit
    const childUnits = await Unit.find({
      parentUnit: basicUnitId,
      status: 'show'
    }).populate('parentUnit', 'name shortCode');

    // Combine basic unit and its children
    const compatibleUnits = [basicUnit, ...childUnits];

    res.send(compatibleUnits);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
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
}; 