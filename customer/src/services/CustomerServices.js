import requests from "./httpServices";

const CustomerServices = {
  loginCustomer: async (body) => {
    return requests.post("/customer/login", body);
  },

  registerCustomer: async (body) => {
    return requests.post("/customer/register", body);
  },

  verifyEmailAddress: async (body) => {
    return requests.post("/customer/verify-email", body);
  },

  verifyAndRegisterCustomer: async (token) => {
    return requests.post("/customer/verify-register", { token });
  },

  verifyPhoneNumber: async (body) => {
    return requests.post("/customer/verify-phone", body);
  },

  forgetPassword: async (body) => {
    return requests.post("/customer/forget-password", body);
  },

  resetPassword: async (body) => {
    return requests.post("/customer/reset-password", body);
  },

  changePassword: async (body) => {
    return requests.post("/customer/change-password", body);
  },

  updateCustomer: async (id, body) => {
    return requests.put(`/customer/${id}`, body);
  },

  getCustomer: async (id) => {
    return requests.get(`/customer/${id}`);
  },

  getShippingAddress: async ({ userId }) => {
    return requests.get(`/customer/shipping/address/${userId}`);
  },

  addShippingAddress: async ({ userId, shippingAddressData }) => {
    return requests.post(`/customer/shipping/address/${userId}`, shippingAddressData);
  },

  updateShippingAddress: async ({ userId, shippingAddressData }) => {
    return requests.put(`/customer/shipping/address/${userId}`, shippingAddressData);
  },

  deleteShippingAddress: async ({ userId }) => {
    return requests.delete(`/customer/shipping/address/${userId}`);
  },

  validateSession: async () => {
    return requests.get("/customer/validate-session");
  },
};

export default CustomerServices; 