const mongoose = require("mongoose");

const deliveryAssignmentSchema = new mongoose.Schema({
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Order", 
    required: true 
  },
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin", 
    required: true 
  },
  status: {
    type: String,
    enum: ["assigned", "picked_up", "out_for_delivery", "delivered", "failed", "returned"],
    default: "assigned"
  },
  assignedAt: { type: Date, default: Date.now },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  
  // Delivery route information
  deliveryRoute: [{
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    estimatedArrival: Date,
    actualArrival: Date
  }],
  
  // Payment collection tracking
  paymentCollection: {
    method: String, // COD, online
    amount: Number,
    collectedAt: Date,
    confirmed: { type: Boolean, default: false }
  },
  
  // Failure tracking
  failureReason: {
    reason: String,
    details: String,
    reportedAt: Date
  },
  
  // Driver notes and feedback
  driverNotes: String,
  customerFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    feedbackAt: Date
  },
  
  // Additional tracking
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin" 
  },
  reassignmentHistory: [{
    previousDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    newDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    reassignedAt: Date,
    reason: String,
    reassignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  }]
}, { 
  timestamps: true 
});

// Indexes for efficient queries
deliveryAssignmentSchema.index({ driver: 1, status: 1 });
deliveryAssignmentSchema.index({ order: 1 });
deliveryAssignmentSchema.index({ status: 1, assignedAt: 1 });
deliveryAssignmentSchema.index({ driver: 1, assignedAt: -1 });

const DeliveryAssignment = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);

module.exports = DeliveryAssignment; 