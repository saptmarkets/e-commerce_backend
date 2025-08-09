const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nameAr: {
      type: String,
      required: false, // Optional - will be empty for Odoo imports
      default: "",
    },
    shortCode: {
      type: String,
      required: false, // Made optional
      unique: true,
      sparse: true, // Only enforce uniqueness for documents that have shortCode
    },
    description: {
      type: String,
      default: "",
    },
    // Optional classification
    type: {
      type: String,
      enum: ["base", "pack", "weight", "volume"],
      default: "pack",
    },
    // To identify base units like 'piece', 'kg', 'liter'
    isBase: {
      type: Boolean,
      default: false,
    },
    // To identify parent units (units that can have children)
    isParent: {
      type: Boolean,
      default: true,
    },
    // Reference to parent unit (for child units)
    parentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      default: null,
    },
    // Pack value (how many base units this unit represents)
    packValue: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["show", "hide"],
      default: "show",
    },
  },
  {
    timestamps: true,
  }
);

unitSchema.index({ shortCode: 1 }, { unique: true, sparse: true }); // Updated to sparse index
unitSchema.index({ isBase: 1 });
unitSchema.index({ isParent: 1 });
unitSchema.index({ parentUnit: 1 });
unitSchema.index({ status: 1 });
unitSchema.index({ name: 1 });

// Helper method to get localized name
unitSchema.methods.getLocalizedName = function(language = 'en') {
  if (language === 'ar' && this.nameAr) {
    return this.nameAr;
  }
  return this.name;
};

// Virtual for getting display name based on language
unitSchema.virtual('displayName').get(function() {
  return this.getLocalizedName();
});

// Pre-save hook to handle packValue logic
unitSchema.pre('save', function(next) {
  // If this is a parent unit (no parentUnit or isParent: true), set packValue to 1
  if (!this.parentUnit || this.isParent) {
    this.packValue = 1;
  }
  
  // If this is a base unit, ensure it's also a parent unit
  if (this.isBase) {
    this.isParent = true;
    this.parentUnit = null;
    this.packValue = 1;
  }
  
  next();
});

// Ensure virtual fields are serialized
unitSchema.set('toJSON', { virtuals: true });
unitSchema.set('toObject', { virtuals: true });

const Unit = mongoose.model("Unit", unitSchema);
module.exports = Unit; 