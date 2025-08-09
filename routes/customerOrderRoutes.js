const express = require("express");
const router = express.Router();
const {
  addOrder,
  getOrderCustomer,
  getOrderById,
  getOrderByInvoice,
  sendEmailInvoiceToCustomer,
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

// Customer cancel their own order
router.put("/:id/cancel", isAuth, customerCancelOrder);

//send email to customer
router.post("/email-invoice", isAuth, sendEmailInvoiceToCustomer);

module.exports = router;
