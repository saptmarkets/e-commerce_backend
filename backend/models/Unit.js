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
      required: true,
      unique: true,
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

unitSchema.index({ shortCode: 1 }, { unique: true });
unitSchema.index({ isBase: 1 });

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

// Ensure virtual fields are serialized
unitSchema.set('toJSON', { virtuals: true });
unitSchema.set('toObject', { virtuals: true });

const Unit = mongoose.model("Unit", unitSchema);
module.exports = Unit; 