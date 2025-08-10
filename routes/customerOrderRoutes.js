const express = require("express");
const router = express.Router();
const {
  addOrder,
  getOrderCustomer,
  getOrderById,
  getOrderByInvoice,
  sendEmailInvoiceToCustomer,
  revertToCheckout,
} = require("../controller/customerOrderController");
const { customerCancelOrder } = require("../controller/orderController");
const { isAuth } = require("../config/auth");

//add a order
router.post("/add", isAuth, addOrder);

//get all order by a user
router.get("/", isAuth, getOrderCustomer);

//get a order by id
router.get("/:id", isAuth, getOrderById);

//get a order by invoice
router.get("/invoice/:invoice", isAuth, getOrderByInvoice);

//send invoice to customer email
router.post("/email-invoice", sendEmailInvoiceToCustomer);

//cancel order by customer
router.put("/cancel/:id", isAuth, customerCancelOrder);

//revert order to checkout (new feature - behind feature flag)
router.post("/:id/revert-to-checkout", isAuth, revertToCheckout);

module.exports = router;
