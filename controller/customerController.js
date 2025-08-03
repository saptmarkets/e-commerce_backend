require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { signInToken, tokenForVerify } = require("../config/auth");
const { sendEmail } = require("../lib/email-sender/sender");
const {
  customerRegisterBody,
} = require("../lib/email-sender/templates/register");
const {
  forgetPasswordEmailBody,
} = require("../lib/email-sender/templates/forget-password");
const { createWelcomeNotification } = require("./notificationController");
const smsService = require("../lib/phone-verification/smsService");
const emailVerificationService = require("../lib/email-verification/emailVerificationService");

const verifyEmailAddress = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log("📧 Email verification request for:", email);

    // Check if email is provided
    if (!email) {
      return res.status(400).send({
        message: "Email address is required.",
      });
    }

    // Validate email format
    if (!emailVerificationService.validateEmail(email)) {
      return res.status(400).send({
        message: "Invalid email format. Please provide a valid email address.",
      });
    }

    // Check if the email is already associated with an existing customer
    const isAdded = await Customer.findOne({ email });
    if (isAdded) {
      return res.status(403).send({
        message: "This email is already registered.",
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = emailVerificationService.generateVerificationCode();

    // Store verification code temporarily (you might want to use Redis for production)
    global.emailVerificationCodes = global.emailVerificationCodes || new Map();
    global.emailVerificationCodes.set(email, {
      code: verificationCode,
      name: name,
      password: password,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send verification code via email
    const sent = await emailVerificationService.sendVerificationCode(email, name, verificationCode);

    if (!sent) {
      return res.status(500).send({
        message: "Failed to send verification code. Please try again.",
        });
      }

    const message = "Verification code sent to your email address!";
    return res.send({ 
      message,
      email: email // Return email for frontend reference
    });
  } catch (err) {
    console.error("❌ Error during email verification:", err);
    res.status(500).send({
      message: "Failed to send verification code. Please try again.",
    });
  }
};

const verifyPhoneNumber = async (req, res) => {
  const phoneNumber = req.body.phone;

  console.log("📱 Phone verification request for:", phoneNumber);

  // Check if phone number is provided
  if (!phoneNumber) {
    return res.status(400).send({
      message: "Phone number is required.",
    });
  }

  // Validate phone number format
  if (!smsService.validatePhoneNumber(phoneNumber)) {
    return res.status(400).send({
      message: "Invalid phone number format. Please provide a valid Saudi Arabia number.",
    });
  }

  try {
    // Check if the phone number is already associated with an existing customer
    const isAdded = await Customer.findOne({ phone: phoneNumber });

    if (isAdded) {
      return res.status(403).send({
        message: "This phone number is already registered.",
      });
    }

    // Generate a 6-digit verification code
    const verificationCode = smsService.generateVerificationCode();

    // Store verification code temporarily (you might want to use Redis for production)
    // For now, we'll store it in memory with expiration
    global.phoneVerificationCodes = global.phoneVerificationCodes || new Map();
    global.phoneVerificationCodes.set(phoneNumber, {
      code: verificationCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Send verification code via SMS
    const sent = await smsService.sendVerificationCode(phoneNumber, verificationCode);

    if (!sent) {
      return res.status(500).send({
        message: "Failed to send verification code. Please try again.",
      });
    }

    const message = "Verification code sent to your phone number!";
    return res.send({ 
      message,
      phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') // Mask phone number
    });
  } catch (err) {
    console.error("❌ Error during phone verification:", err);
    res.status(500).send({
      message: "Failed to send verification code. Please try again.",
    });
  }
};

const verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  console.log("📧 Email code verification request for:", email);

  if (!email || !code) {
    return res.status(400).send({
      message: "Email and verification code are required.",
    });
  }

  try {
    // Check if verification code exists and is valid
    global.emailVerificationCodes = global.emailVerificationCodes || new Map();
    const verificationData = global.emailVerificationCodes.get(email);

    if (!verificationData) {
      return res.status(400).send({
        message: "No verification code found for this email. Please request a new code.",
      });
    }

    // Check if code has expired
    if (new Date() > verificationData.expiresAt) {
      global.emailVerificationCodes.delete(email);
      return res.status(400).send({
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // Check if code matches
    if (verificationData.code !== code) {
      return res.status(400).send({
        message: "Invalid verification code. Please check and try again.",
      });
    }

    // Check if email is already registered
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).send({
        message: "This email is already registered!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(verificationData.password, 12);

    // Create new customer
    const customer = new Customer({
      name: verificationData.name,
      email,
      password: hashedPassword,
    });

    await customer.save();

    // Clear the verification code
    global.emailVerificationCodes.delete(email);

    // Create welcome notification
    try {
      await createWelcomeNotification(customer._id);
    } catch (notifError) {
      console.error("Failed to create welcome notification:", notifError);
    }

    console.log("✅ Customer registered successfully via email verification:", email);

    res.status(201).send({
      message: "Account created successfully! You can now login.",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      }
    });

  } catch (err) {
    console.error("❌ Error during email code verification:", err);
    res.status(500).send({
      message: "Failed to verify code and create account. Please try again.",
    });
  }
};

const verifyPhoneCode = async (req, res) => {
  const { phone, code, name, email, password } = req.body;

  console.log("📱 Phone code verification request for:", phone);

  if (!phone || !code || !name || !email || !password) {
    return res.status(400).send({
      message: "Phone number, verification code, name, email, and password are required.",
    });
  }

  try {
    // Check if verification code exists and is valid
    global.phoneVerificationCodes = global.phoneVerificationCodes || new Map();
    const verificationData = global.phoneVerificationCodes.get(phone);

    if (!verificationData) {
      return res.status(400).send({
        message: "No verification code found for this phone number. Please request a new code.",
      });
    }

    // Check if code has expired
    if (new Date() > verificationData.expiresAt) {
      global.phoneVerificationCodes.delete(phone);
      return res.status(400).send({
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // Check if code matches
    if (verificationData.code !== code) {
      return res.status(400).send({
        message: "Invalid verification code. Please check and try again.",
      });
    }

    // Check if email is already registered
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).send({
        message: "This email is already registered!",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new customer
    const customer = new Customer({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await customer.save();

    // Clear the verification code
    global.phoneVerificationCodes.delete(phone);

    // Create welcome notification
    try {
      await createWelcomeNotification(customer._id);
    } catch (notifError) {
      console.error("Failed to create welcome notification:", notifError);
    }

    console.log("✅ Customer registered successfully via phone verification:", email);

    res.status(201).send({
      message: "Account created successfully! You can now login.",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });

  } catch (err) {
    console.error("❌ Error during phone code verification:", err);
    res.status(500).send({
      message: "Failed to verify code and create account. Please try again.",
    });
  }
};

const registerCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        message: "Please provide all required fields!"
      });
    }

    // Check if user already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).send({
        message: "This email is already registered!"
      });
    }

    // Don't create the user immediately - create a verification token instead
    // Generate a token for verification
    const token = tokenForVerify({
      name,
      email,
      password
    });
    
    const option = {
      name,
      email,
      token,
    };

    const body = customerRegisterBody(option);
      
    const emailData = {
      to: email,
      subject: 'Verify Your Email',
      html: body,
    };

    try {
      await sendEmail(emailData);
      res.status(200).send({
        success: true,
        message: "Please check your email to complete registration!"
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      res.status(500).send({
        message: "Failed to send verification email. Please try again."
      });
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send({
      message: err.message || "An error occurred during registration."
    });
  }
};

const addAllCustomers = async (req, res) => {
  try {
    await Customer.deleteMany();
    await Customer.insertMany(req.body);
    res.send({
      message: "Added all users successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).send({
        message: "Email and password are required",
        error: "Email and password are required"
      });
    }
    
    console.log("Login attempt for email:", email);
    const customer = await Customer.findOne({ email: email });

    console.log("Found customer:", customer ? "Yes" : "No");
    
    if (!customer) {
      return res.status(401).send({
        message: "No account found with this email!",
        error: "No account found with this email!"
      });
    }

    if (!customer.password) {
      return res.status(401).send({
        message: "Please sign up with email and password first!",
        error: "Please sign up with email and password first!"
      });
    }

    const isPasswordValid = bcrypt.compareSync(password, customer.password);
    console.log("Password validation:", isPasswordValid ? "Success" : "Failed");

    if (isPasswordValid) {
      const token = signInToken(customer);
      
      // Return a clean user object with token
      return res.status(200).send({
        token,
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        address: customer.address || "",
        phone: customer.phone || "",
        image: customer.image || "",
        message: "Login successful"
      });
    } else {
      return res.status(401).send({
        message: "Invalid password!",
        error: "Invalid password!"
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send({
      message: err.message || "An error occurred during login",
      error: "An error occurred during login"
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const isAdded = await Customer.findOne({ email: req.body.email });
    if (!isAdded) {
      return res.status(404).send({
        message: "User Not found with this email!",
      });
    } 
    
    const token = tokenForVerify(isAdded);
    const option = {
      name: isAdded.name,
      email: isAdded.email,
      token: token,
    };

    const emailData = {
      to: req.body.email,
      subject: "Password Reset",
      html: forgetPasswordEmailBody(option),
    };

    try {
      await sendEmail(emailData);
      res.send({
        message: "Please check your email to reset password!"
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      res.status(500).send({
        message: "Failed to send password reset email. Please try again."
      });
    }
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).send({
      message: err.message
    });
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const customer = await Customer.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        customer.password = bcrypt.hashSync(req.body.newPassword);
        customer.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    // console.log("changePassword", req.body);
    const customer = await Customer.findOne({ email: req.body.email });
    if (!customer.password) {
      return res.status(403).send({
        message:
          "For change password,You need to sign up with email & password!",
      });
    } else if (
      customer &&
      bcrypt.compareSync(req.body.currentPassword, customer.password)
    ) {
      customer.password = bcrypt.hashSync(req.body.newPassword);
      await customer.save();
      res.send({
        message: "Your password change successfully!",
      });
    } else {
      res.status(401).send({
        message: "Invalid email or current password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    // const { user } = jwt.decode(req.body.params);
    const user = jwt.decode(req.params.token);

    // console.log("user", user);
    const isAdded = await Customer.findOne({ email: user.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new Customer({
        name: user.name,
        email: user.email,
        image: user.picture,
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithOauthProvider = async (req, res) => {
  try {
    // console.log("user", user);
    // console.log("signUpWithOauthProvider", req.body);
    const isAdded = await Customer.findOne({ email: req.body.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new Customer({
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const users = await Customer.find({}).sort({ _id: -1 });
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.send(customer);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Shipping address create or update
const addShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    const newShippingAddress = req.body;

    // Find the customer by ID and update the shippingAddress field
    const result = await Customer.updateOne(
      { _id: customerId },
      {
        $set: {
          shippingAddress: newShippingAddress,
        },
      },
      { upsert: true } // Create a new document if no document matches the filter
    );

    if (result.nModified > 0 || result.upserted) {
      return res.send({
        message: "Shipping address added or updated successfully.",
      });
    } else {
      return res.status(404).send({ message: "Customer not found." });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    // const addressId = req.query.id;

    // console.log("getShippingAddress", customerId);
    // console.log("addressId", req.query);

    const customer = await Customer.findById(customerId);
    res.send({ shippingAddress: customer?.shippingAddress });

    // if (addressId) {
    //   // Find the specific address by its ID
    //   const address = customer.shippingAddress.find(
    //     (addr) => addr._id.toString() === addressId.toString()
    //   );

    //   if (!address) {
    //     return res.status(404).send({
    //       message: "Shipping address not found!",
    //     });
    //   }

    //   return res.send({ shippingAddress: address });
    // } else {
    //   res.send({ shippingAddress: customer?.shippingAddress });
    // }
  } catch (err) {
    // console.error("Error adding shipping address:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;

    const Customer = activeDB.model("Customer", CustomerModel);
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.shippingAddress.push(req.body);

      await customer.save();
      res.send({ message: "Success" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;
    const { userId, shippingId } = req.params;

    const Customer = activeDB.model("Customer", CustomerModel);
    await Customer.updateOne(
      { _id: userId },
      {
        $pull: {
          shippingAddress: { _id: shippingId },
        },
      }
    );

    res.send({ message: "Shipping Address Deleted Successfully!" });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    console.log("🔄 Customer update request:", {
      customerId: req.params.id,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate the input - extract all possible fields
    const { name, email, address, phone, image, country, city, area } = req.body;

    // Find the customer by ID
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({
        message: "Customer not found!",
      });
    }

    // Check if the email already exists and does not belong to the current customer
    if (email && email !== customer.email) {
    const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
      return res.status(400).send({
        message: "Email already exists.",
      });
    }
    }

    // Update customer details - only update fields that are provided
    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email;
    if (address !== undefined) customer.address = address;
    if (phone !== undefined) customer.phone = phone;
    if (image !== undefined) customer.image = image;
    if (country !== undefined) customer.country = country;
    if (city !== undefined) customer.city = city;
    if (area !== undefined) customer.area = area;

    console.log("📝 Updating customer with data:", {
      name: customer.name,
      email: customer.email,
      address: customer.address,
      phone: customer.phone,
      country: customer.country,
      city: customer.city,
      area: customer.area
    });

    // Save the updated customer
    const updatedUser = await customer.save();

    console.log("✅ Customer updated successfully:", updatedUser._id);

    // Generate a new token
    const token = signInToken(updatedUser);

    // Send the updated customer data with the new token
    res.send({
      token,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      phone: updatedUser.phone,
      image: updatedUser.image,
      country: updatedUser.country,
      city: updatedUser.city,
      area: updatedUser.area,
      message: "Customer updated successfully!",
    });
  } catch (err) {
    console.error("❌ Customer update error:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteCustomer = (req, res) => {
  Customer.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "User Deleted Successfully!",
      });
    }
  });
};

const verifyAndRegisterCustomer = async (req, res) => {
  try {
    const { token } = req.body;
    
    console.log("Email verification attempt:", {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      timestamp: new Date().toISOString()
    });
    
    if (!token) {
      return res.status(400).send({
        message: "Verification token is required!"
      });
    }
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, async (err, decoded) => {
      if (err) {
        console.error("JWT verification failed:", {
          error: err.message,
          name: err.name,
          expiredAt: err.expiredAt,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = "Token is invalid or has expired!";
        if (err.name === 'TokenExpiredError') {
          errorMessage = "Verification link has expired. Please sign up again to get a new verification email.";
        } else if (err.name === 'JsonWebTokenError') {
          errorMessage = "Invalid verification link. Please sign up again to get a new verification email.";
        }
        
        return res.status(401).send({
          message: errorMessage,
          error: err.name,
          debug: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      // Extract user info from token
      const { name, email, password } = decoded;
      
      console.log("Token verified successfully for:", email);
      
      try {
        // Check if user already exists
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
          console.log("Customer already exists, returning login token");
          // If customer exists but is trying to verify again, just return success with login token
          const loginToken = signInToken(existingCustomer);
          
          return res.status(200).send({
            token: loginToken,
            _id: existingCustomer._id,
            name: existingCustomer.name,
            email: existingCustomer.email,
            message: "Account already exists! You can login now."
          });
        }
        
        // Create new customer with hashed password
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        console.log("Creating new customer:", email);
        
        const newCustomer = new Customer({
          name,
          email,
          password: hashedPassword
        });
        
        // Save the customer
        const customer = await newCustomer.save();
        
        console.log("Customer created successfully:", customer._id);
        
        // Create welcome notification for new customer
        try {
          await createWelcomeNotification(customer._id, customer.name);
        } catch (notificationError) {
          console.error("Failed to create welcome notification:", notificationError);
          // Don't fail registration if notification creation fails
        }
        
        // Generate login token
        const loginToken = signInToken(customer);
        
        res.status(201).send({
          token: loginToken,
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          message: "Registration successful! You can now login."
        });
      } catch (error) {
        console.error("Database operation error:", error);
        return res.status(500).send({
          message: "An error occurred while processing your request.",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).send({
      message: err.message || "An error occurred during verification.",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

module.exports = {
  loginCustomer,
  verifyPhoneNumber,
  verifyPhoneCode,
  verifyEmailCode,
  registerCustomer,
  addAllCustomers,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
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
};
