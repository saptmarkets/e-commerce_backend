const express = require("express");
const router = express.Router();
const {
  loginCustomer,
  registerCustomer,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
  verifyEmailCode,
  verifyPhoneNumber,
  verifyPhoneCode,
  verifyAndRegisterCustomer,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addShippingAddress,
  getShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} = require("../controller/customerController");

//verify email
router.post("/verify-email", verifyEmailAddress);

//verify email code and register customer
router.post("/verify-email-code", verifyEmailCode);

//verify phone number
router.post("/verify-phone", verifyPhoneNumber);

//verify phone code and register customer
router.post("/verify-phone-code", verifyPhoneCode);

//verify and register customer with token
router.post("/verify-register", verifyAndRegisterCustomer);

//register a customer
router.post("/register", registerCustomer);

//login a customer
router.post("/login", loginCustomer);

//forget-password
router.post("/forget-password", forgetPassword);

//reset-password
router.put("/reset-password", resetPassword);

//change-password
router.post("/change-password", changePassword);

//signUp with provider
router.get("/signup/:token", signUpWithProvider);

//register with social auth
router.post("/signup-auth", signUpWithOauthProvider);

//get all customer
router.get("/", getAllCustomers);

//get a customer
router.get("/:id", getCustomerById);

//update a customer
router.put("/:id", updateCustomer);

//delete a customer
router.delete("/:id", deleteCustomer);

//add shipping address
router.post("/shipping/address/:id", addShippingAddress);

//get shipping address
router.get("/shipping/address/:id", getShippingAddress);

//update shipping address
router.put("/shipping/address/:id", updateShippingAddress);

//delete shipping address
router.delete("/shipping/address/:id", deleteShippingAddress);

module.exports = router;
