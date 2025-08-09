const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const jwt = require("jsonwebtoken");
const {
  signInToken,
  tokenForVerify,
  handleEncryptData,
} = require("../config/auth");
const { sendEmail } = require("../lib/email-sender/sender");
const Admin = require("../models/Admin");

const registerAdmin = async (req, res) => {
  try {
    const isAdded = await Admin.findOne({ email: req.body.email });
    if (isAdded) {
      return res.status(403).send({
        message: "This Email already Added!",
      });
    } else {
      const newStaff = new Admin({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: bcrypt.hashSync(req.body.password),
      });
      const staff = await newStaff.save();
      const token = signInToken(staff);
      res.send({
        token,
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        joiningData: Date.now(),
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const admin = await Admin.findOne({ email: req.body.email });
    console.log('Found admin:', admin ? 'yes' : 'no');
    
    if (admin) {
      console.log('Admin role:', admin.role);
      console.log('Admin status:', admin.status);
      console.log('Admin access_list:', admin.access_list);
      
      const passwordMatch = bcrypt.compareSync(req.body.password, admin.password);
      console.log('Password match:', passwordMatch);

      if (passwordMatch) {
        // Check if user is a driver - drivers should not access admin panel
        if (admin.role === "Driver") {
          return res.status(403).send({
            message: "Drivers cannot access the admin panel. Please use the SaptMarkets Delivery mobile app instead.",
          });
        }
        
        if (admin?.status === "Inactive") {
          return res.status(403).send({
            message:
              "Sorry, you don't have the access right now, please contact with Super Admin.",
          });
        }
        const token = signInToken(admin);
        console.log('Token generated:', token ? 'yes' : 'no');

        const { data, iv } = handleEncryptData([
          ...admin?.access_list,
          admin.role,
        ]);
        console.log('Data encrypted:', data ? 'yes' : 'no');
        
        res.send({
          token,
          _id: admin._id,
          name: admin.name,
          phone: admin.phone,
          email: admin.email,
          image: admin.image,
          iv,
          data,
        });
      } else {
        res.status(401).send({
          message: "Invalid Email or password!",
        });
      }
    } else {
      res.status(401).send({
        message: "Invalid Email or password!",
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await Admin.findOne({ email: req.body.verifyEmail });
  if (!isAdded) {
    return res.status(404).send({
      message: "Admin/Staff Not found with this email!",
    });
  } else {
    const token = tokenForVerify(isAdded);
    const body = {
      from: process.env.EMAIL_USER,
      to: `${req.body.verifyEmail}`,
      subject: "Password Reset",
      html: `<h2>Hello ${req.body.verifyEmail}</h2>
      <p>A request has been received to change the password for your <strong>saptmarkets</strong> account </p>

        <p>This link will expire in <strong> 15 minute</strong>.</p>

        <p style="margin-bottom:20px;">Click this link for reset your password</p>

        <a href=${process.env.ADMIN_URL}/auth/reset-password/${token}  style="background:#22c55e;color:white;border:1px solid #22c55e; padding: 10px 15px; border-radius: 4px; text-decoration:none;">Reset Password </a>

        
        <p style="margin-top: 35px;">If you did not initiate this request, please contact us immediately at support@saptmarkets.com</p>

        <p style="margin-bottom:0px;">Thank you</p>
        <strong>saptmarkets Team</strong>
             `,
    };
    const message = "Please check your email to reset password!";
    sendEmail(body, res, message);
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const staff = await Admin.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        staff.password = bcrypt.hashSync(req.body.newPassword);
        staff.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const addStaff = async (req, res) => {
  // console.log("add staf....", req.body.staffData);
  try {
    const isAdded = await Admin.findOne({ email: req.body.email });
    if (isAdded) {
      return res.status(500).send({
        message: "This Email already Added!",
      });
    } else {
      const staffData = {
        name: { ...req.body.name },
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password),
        phone: req.body.phone,
        joiningDate: req.body.joiningDate,
        role: req.body.role,
        image: req.body.image,
        access_list: req.body.access_list,
      };

      // Add driver-specific fields if role is Driver
      if (req.body.role === "Driver") {
        console.log("Creating driver with delivery info:", req.body);
        
        staffData.deliveryInfo = {
          vehicleType: req.body.vehicleType || req.body.deliveryInfo?.vehicleType || "bike",
          vehicleNumber: req.body.vehicleNumber || req.body.deliveryInfo?.vehicleNumber || "",
          licenseNumber: req.body.licenseNumber || req.body.deliveryInfo?.licenseNumber || "",
          phoneNumber: req.body.phone || req.body.deliveryInfo?.phoneNumber,
          emergencyContact: {
            name: req.body.emergencyContactName || req.body.deliveryInfo?.emergencyContact?.name || "",
            phone: req.body.emergencyContactPhone || req.body.deliveryInfo?.emergencyContact?.phone || ""
          },
          workingHours: {
            start: req.body.workingHoursStart || req.body.deliveryInfo?.workingHours?.start || "09:00",
            end: req.body.workingHoursEnd || req.body.deliveryInfo?.workingHours?.end || "18:00"
          },
          maxDeliveryRadius: req.body.maxDeliveryRadius || req.body.deliveryInfo?.maxDeliveryRadius || 10,
          currentLocation: {
            latitude: 0,
            longitude: 0,
            lastUpdated: new Date()
          },
          isOnDuty: false,
          availability: "offline"
        };

        staffData.deliveryStats = {
          totalDeliveries: 0,
          completedToday: 0,
          averageRating: 5.0,
          totalRatings: 0,
          successRate: 100,
          averageDeliveryTime: 0,
          totalEarnings: 0,
          earningsToday: 0
        };
      }

      const newStaff = new Admin(staffData);
      await newStaff.save();
      
      console.log(`✅ ${req.body.role} created successfully: ${req.body.name?.en || req.body.email}`);
      
      res.status(200).send({
        message: `${req.body.role} Added Successfully!`,
        staff: {
          _id: newStaff._id,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          deliveryInfo: newStaff.deliveryInfo
        }
      });
    }
  } catch (err) {
    console.error('Add staff error:', err);
    res.status(500).send({
      message: err.message,
    });
    // console.log("error", err);
  }
};

const getAllStaff = async (req, res) => {
  // console.log('allamdin')
  try {
    const admins = await Admin.find({}).sort({ _id: -1 });
    res.send(admins);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getStaffById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    res.send(admin);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStaff = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id });

    if (admin) {
      admin.name = { ...admin.name, ...req.body.name };
      admin.email = req.body.email;
      admin.phone = req.body.phone;
      admin.role = req.body.role;
      admin.access_list = req.body.access_list;
      admin.joiningData = req.body.joiningDate;
      admin.image = req.body.image;
      
      // Handle password update if provided
      if (req.body.password && req.body.password.trim() !== '') {
        admin.password = bcrypt.hashSync(req.body.password, 10);
      }

      // Handle driver-specific fields if role is Driver
      if (req.body.role === "Driver") {
        console.log("Updating driver with delivery info:", req.body);
        
        // Initialize deliveryInfo if it doesn't exist
        if (!admin.deliveryInfo) {
          admin.deliveryInfo = {};
        }
        
        // Update delivery info fields
        admin.deliveryInfo = {
          ...admin.deliveryInfo,
          vehicleType: req.body.vehicleType || req.body.deliveryInfo?.vehicleType || admin.deliveryInfo.vehicleType || "bike",
          vehicleNumber: req.body.vehicleNumber || req.body.deliveryInfo?.vehicleNumber || admin.deliveryInfo.vehicleNumber || "",
          licenseNumber: req.body.licenseNumber || req.body.deliveryInfo?.licenseNumber || admin.deliveryInfo.licenseNumber || "",
          phoneNumber: req.body.phone || req.body.deliveryInfo?.phoneNumber || admin.deliveryInfo.phoneNumber,
          emergencyContact: {
            name: req.body.emergencyContactName || req.body.deliveryInfo?.emergencyContact?.name || admin.deliveryInfo.emergencyContact?.name || "",
            phone: req.body.emergencyContactPhone || req.body.deliveryInfo?.emergencyContact?.phone || admin.deliveryInfo.emergencyContact?.phone || ""
          },
          workingHours: {
            start: req.body.workingHoursStart || req.body.deliveryInfo?.workingHours?.start || admin.deliveryInfo.workingHours?.start || "09:00",
            end: req.body.workingHoursEnd || req.body.deliveryInfo?.workingHours?.end || admin.deliveryInfo.workingHours?.end || "18:00"
          },
          maxDeliveryRadius: req.body.maxDeliveryRadius || req.body.deliveryInfo?.maxDeliveryRadius || admin.deliveryInfo.maxDeliveryRadius || 10,
          currentLocation: admin.deliveryInfo.currentLocation || {
            latitude: 0,
            longitude: 0,
            lastUpdated: new Date()
          },
          isOnDuty: admin.deliveryInfo.isOnDuty || false,
          availability: admin.deliveryInfo.availability || "offline"
        };

        // Initialize deliveryStats if it doesn't exist
        if (!admin.deliveryStats) {
          admin.deliveryStats = {
            totalDeliveries: 0,
            completedToday: 0,
            averageRating: 5.0,
            totalRatings: 0,
            successRate: 100,
            averageDeliveryTime: 0,
            totalEarnings: 0,
            earningsToday: 0
          };
        }
      }

      const updatedAdmin = await admin.save();
      const token = signInToken(updatedAdmin);

      const { data, iv } = handleEncryptData([
        ...updatedAdmin?.access_list,
        updatedAdmin.role,
      ]);
      
      console.log(`📝 ${updatedAdmin.role} updated successfully: ${updatedAdmin.name?.en || updatedAdmin.email}`);
      
      res.send({
        token,
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        image: updatedAdmin.image,
        role: updatedAdmin.role,
        deliveryInfo: updatedAdmin.deliveryInfo,
        data,
        iv,
      });
    } else {
      res.status(404).send({
        message: "This Staff not found!",
      });
    }
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteStaff = (req, res) => {
  Admin.deleteOne({ _id: req.params.id }, (err) => {
    if (err) {
      res.status(500).send({
        message: err.message,
      });
    } else {
      res.status(200).send({
        message: "Admin Deleted Successfully!",
      });
    }
  });
};

const updatedStatus = async (req, res) => {
  try {
    const newStatus = req.body.status;

    await Admin.updateOne(
      { _id: req.params.id },
      {
        $set: {
          status: newStatus,
        },
      }
    );
    res.send({
      message: `Staff ${newStatus} Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  forgetPassword,
  resetPassword,
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  updatedStatus,
};
