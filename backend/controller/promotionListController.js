const PromotionList = require("../models/PromotionList");

// Create a new promotion list
const addPromotionList = async (req, res) => {
  try {
    console.log('Creating promotion list with data:', JSON.stringify(req.body, null, 2));

    const promotionListData = {
      name: req.body.name,
      description: req.body.description || '',
      type: req.body.type,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      defaultValue: req.body.defaultValue || 0,
      priority: req.body.priority || 1,
    };

    const newPromotionList = new PromotionList(promotionListData);
    await newPromotionList.save();

    res.status(201).send({
      message: "Promotion list created successfully!",
      promotionList: newPromotionList,
    });
  } catch (err) {
    console.error('Error creating promotion list:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get all promotion lists with pagination
const getAllPromotionLists = async (req, res) => {
  const { page = 1, limit = 10, type, isActive } = req.query;
  
  try {
    const queryObject = {};
    if (type) {
      queryObject.type = type;
    }
    if (isActive !== undefined) {
      queryObject.isActive = isActive === 'true';
    }

    const count = await PromotionList.countDocuments(queryObject);
    const promotionLists = await PromotionList.find(queryObject)
      .sort({ priority: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.send({
      promotionLists,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      totalPromotionLists: count,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Get active promotion lists for selection
const getActivePromotionLists = async (req, res) => {
  try {
    const { type } = req.query;
    
    const queryObject = { isActive: true };
    if (type) {
      queryObject.type = type;
    }

    const promotionLists = await PromotionList.find(queryObject)
      .sort({ priority: 1, name: 1 });

    res.status(200).json(promotionLists);
  } catch (err) {
    console.error('Error in getActivePromotionLists:', err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// Get a promotion list by ID
const getPromotionListById = async (req, res) => {
  try {
    const promotionList = await PromotionList.findById(req.params.id);
      
    if (!promotionList) {
      return res.status(404).send({
        message: "Promotion list not found",
      });
    }
    
    res.send(promotionList);
  } catch (err) {
    console.error('Error fetching promotion list by ID:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update a promotion list
const updatePromotionList = async (req, res) => {
  try {
    const promotionList = await PromotionList.findById(req.params.id);
    
    if (!promotionList) {
      return res.status(404).send({
        message: "Promotion list not found",
      });
    }
    
    console.log('Updating promotion list with data:', JSON.stringify(req.body, null, 2));
    
    const updatedPromotionList = await PromotionList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.send({
      message: "Promotion list updated successfully!",
      promotionList: updatedPromotionList,
    });
  } catch (err) {
    console.error('Error updating promotion list:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

// Delete a promotion list
const deletePromotionList = async (req, res) => {
  try {
    const promotionList = await PromotionList.findByIdAndDelete(req.params.id);
    
    if (!promotionList) {
      return res.status(404).send({
        message: "Promotion list not found",
      });
    }
    
    res.send({
      message: "Promotion list deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Delete multiple promotion lists
const deleteManyPromotionLists = async (req, res) => {
  try {
    if (!req.body.ids || !Array.isArray(req.body.ids)) {
      return res.status(400).send({
        message: "Promotion list IDs are required",
      });
    }
    
    await PromotionList.deleteMany({ _id: { $in: req.body.ids } });
    
    res.send({
      message: "Promotion lists deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Update promotion list status
const updatePromotionListStatus = async (req, res) => {
  try {
    if (req.body.isActive === undefined) {
      return res.status(400).send({
        message: "Status is required",
      });
    }
    
    const promotionList = await PromotionList.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    
    if (!promotionList) {
      return res.status(404).send({
        message: "Promotion list not found",
      });
    }
    
    res.send({
      message: `Promotion list ${req.body.isActive ? 'activated' : 'deactivated'} successfully!`,
      promotionList,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addPromotionList,
  getAllPromotionLists,
  getActivePromotionLists,
  getPromotionListById,
  updatePromotionList,
  deletePromotionList,
  deleteManyPromotionLists,
  updatePromotionListStatus,
}; 