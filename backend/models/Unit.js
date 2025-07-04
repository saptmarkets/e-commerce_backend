const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

const Unit = mongoose.model("Unit", unitSchema);
module.exports = Unit; 