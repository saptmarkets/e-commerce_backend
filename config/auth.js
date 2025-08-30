require("dotenv").config();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const mongoose = require('mongoose');

const signInToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Reduced from 7d to 1h
  );
};

const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
    },
    process.env.JWT_SECRET_FOR_VERIFY,
    { expiresIn: "24h" }
  );
};

const isAuth = (req, res, next) => {
  console.log('🔍 DEBUG: isAuth middleware called for:', req.method, req.path);
  console.log('🔍 DEBUG: Request headers:', req.headers);
  
  const token = req.header("authorization");
  if (!token) {
    console.log('🔍 DEBUG: No authorization token provided');
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  console.log('🔍 DEBUG: Token found:', token.substring(0, 20) + '...');

  try {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    console.log('🔍 DEBUG: Token decoded successfully for user:', decoded._id);
    
    // Check if the token contains corrupted data
    if (decoded._id === "banners" || typeof decoded._id === "string" && decoded._id.includes("banners")) {
      console.error("CORRUPTED JWT TOKEN DETECTED - contains 'banners' as user ID");
      return res.status(401).json({ 
        message: "JWT token is corrupted. Please log out and log back in to refresh your session.",
        error: "CORRUPTED_TOKEN",
        details: "Your authentication token contains invalid data and needs to be refreshed."
      });
    }
    
    req.user = decoded;
    console.log('🔍 DEBUG: User authenticated successfully');
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({ 
      message: "Invalid token. Please log out and log back in.",
      error: error.message 
    });
  }
};

// Customer authentication middleware
const isCustomer = (req, res, next) => {
  const token = req.header("authorization") || req.header("Authorization");
  
  if (!token) {
    // For customer notifications, we can still proceed without token for global notifications
    // But we'll set a header to indicate no customer authentication
    req.headers['customer-id'] = null;
    return next();
  }

  try {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    
    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
      console.error("Invalid customer ID format in token:", decoded._id);
      return res.status(401).json({ 
        message: "Invalid token format. Please log out and log back in.",
        error: "INVALID_CUSTOMER_ID_FORMAT"
      });
    }
    
    req.user = decoded;
    req.headers['customer-id'] = decoded._id;
    next();
  } catch (error) {
    console.error("Customer JWT verification error:", error.message);
    
    // For expired or invalid tokens, still allow access but without customer ID
    req.headers['customer-id'] = null;
    req.user = null;
    next();
  }
};

// Strict customer authentication (requires valid token)
const requireCustomerAuth = async (req, res, next) => {
  const token = req.header("authorization") || req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ 
      message: "Access denied. Customer authentication required.",
      error: "NO_TOKEN"
    });
  }

  try {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    
    // Validate customer ID format
    if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
      return res.status(401).json({ 
        message: "Invalid token format. Please log out and log back in.",
        error: "INVALID_CUSTOMER_ID_FORMAT"
      });
    }
    
    // Verify customer exists in database
    const customer = await Customer.findById(decoded._id);
    if (!customer) {
      return res.status(401).json({ 
        message: "Customer not found. Please log in again.",
        error: "CUSTOMER_NOT_FOUND"
      });
    }
    
    req.user = decoded;
    req.customer = customer;
    next();
  } catch (error) {
    console.error("Customer authentication error:", error.message);
    return res.status(401).json({ 
      message: "Invalid or expired token. Please log in again.",
      error: error.message 
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error("No authenticated user found in request");
      return res.status(401).json({ message: "User is not authenticated" });
    }

    // Fast-path: trust role in JWT for Admin/Super Admin to avoid DB lookups and ObjectId casting issues
    if (req.user.role === "Admin" || req.user.role === "Super Admin") {
      req.admin = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      };
      return next();
    }

    // Checking admin status for user ID
    
    // Validate ObjectId format before database query
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      console.error("Invalid ObjectId format:", req.user._id);
      
      // Special case for the "banners" corruption
      if (req.user._id === "banners" || req.user._id.includes("banners")) {
        return res.status(401).json({ 
          message: "JWT token is corrupted with 'banners' data. Please clear your browser storage, log out completely, and log back in.",
          error: "CORRUPTED_TOKEN_BANNERS",
          instructions: [
            "1. Open browser developer tools (F12)",
            "2. Go to Application/Storage tab",
            "3. Clear all localStorage and sessionStorage",
            "4. Log out of the admin panel",
            "5. Close and reopen your browser",
            "6. Log back in"
          ]
        });
      }
      
      return res.status(401).json({ 
        message: "Invalid user ID format in token. Please log out and log back in.",
        error: "INVALID_USER_ID_FORMAT"
      });
    }

    // Find the current user in Admin collection
    const admin = await Admin.findById(req.user._id);
    
    if (!admin) {
      console.error("Admin not found with ID:", req.user._id);
      return res.status(401).json({ message: "Admin user not found" });
    }

    // Admin found with role

    // Check if user has admin role
    if (admin.role !== "Admin" && admin.role !== "Super Admin") {
      console.error("User does not have admin role:", admin.role);
      return res.status(403).json({ message: "User is not Admin" });
    }

    // Add admin info to request for use in controllers
    req.admin = admin;
    next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    
    // Handle specific MongoDB cast errors
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(401).json({ 
        message: "JWT token contains invalid user ID. Please log out and log back in to refresh your session.",
        error: "INVALID_TOKEN_USER_ID",
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      message: "Internal server error during authentication",
      error: error.message 
    });
  }
};

const secretKey = process.env.ENCRYPT_PASSWORD || 'saptmarkets-default-encryption-key-123';

// Ensure the secret key is exactly 32 bytes (256 bits)
const key = crypto.createHash("sha256").update(String(secretKey)).digest();

// Helper function to encrypt data using AES-256-CBC
const handleEncryptData = (data) => {
  if (!data) {
    return { data: '', iv: '' };
  }
  
  // Generate a new IV for each encryption
  const iv = crypto.randomBytes(16);
  const dataToEncrypt = typeof data === "string" ? data : JSON.stringify(data);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encryptedData = cipher.update(dataToEncrypt, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return {
    data: encryptedData,
    iv: iv.toString("hex"),
  };
};

// Helper function to decrypt data using AES-256-CBC
const handleDecryptData = (encryptedData, ivHex) => {
  if (!encryptedData || !ivHex) {
    return null;
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decryptedData = decipher.update(encryptedData, "hex", "utf8");
    decryptedData += decipher.final("utf8");
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

module.exports = {
  isAuth,
  isAdmin,
  isCustomer,
  requireCustomerAuth,
  signInToken,
  tokenForVerify,
  handleEncryptData,
  handleDecryptData,
};
