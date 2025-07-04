const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: Object,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
      default: "Active",
      enum: ["Active", "Inactive"],
    },
    password: {
      type: String,
      required: false,
      default: bcrypt.hashSync("12345678"),
    },
    role: {
      type: String,
      required: true,
      default: "Admin",
      enum: [
        "Admin",
        "Super Admin",
        "Cashier",
        "Manager",
        "CEO",
        "Driver",
        "Security Guard",
        "Accountant",
      ],
    },
    access_list: {
      type: Array,
      required: false,
    },
    joiningData: {
      type: Date,
      required: false,
    },
    
    // Delivery-specific fields for Driver role  
    deliveryInfo: {
      vehicleType: { 
        type: String, 
        enum: ["bike", "car", "van", "scooter"]
      },
      vehicleNumber: String,
      licenseNumber: String,
      phoneNumber: String,
      emergencyContact: {
        name: String,
        phone: String
      },
      workingHours: {
        start: { type: String, default: "09:00" }, // "09:00"
        end: { type: String, default: "18:00" }    // "18:00"
      },
      maxDeliveryRadius: { type: Number, default: 10 }, // in km
      currentLocation: {
        latitude: Number,
        longitude: Number,
        lastUpdated: { type: Date, default: Date.now }
      },
      isOnDuty: { type: Boolean, default: false },
      shiftStartTime: Date,
      shiftEndTime: Date,
      
      // Break management
      isOnBreak: { type: Boolean, default: false },
      breakStartTime: Date,
      breakEndTime: Date,
      breakHistory: [{
        startTime: Date,
        endTime: Date,
        duration: Number // in minutes
      }],
      
      // Availability status
      availability: {
        type: String,
        enum: ["available", "busy", "offline"],
        default: "offline"
      }
    },
    
    // Delivery performance statistics
    deliveryStats: {
      totalDeliveries: { type: Number, default: 0 },
      completedToday: { type: Number, default: 0 },
      averageRating: { type: Number, default: 5.0 },
      totalRatings: { type: Number, default: 0 },
      successRate: { type: Number, default: 100 }, // percentage
      averageDeliveryTime: { type: Number, default: 0 }, // in minutes
      totalEarnings: { type: Number, default: 0 },
      earningsToday: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient driver queries
adminSchema.index({ role: 1, 'deliveryInfo.isOnDuty': 1 });
adminSchema.index({ 'deliveryInfo.availability': 1 });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
