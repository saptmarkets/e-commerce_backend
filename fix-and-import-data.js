require("dotenv").config();
const mongoose = require("mongoose");

const Admin = require("./models/Admin");
const adminData = require("./utils/admin");

const Product = require("./models/Product");
const productData = require("./utils/products");

const Category = require("./models/Category");
const categoryData = require("./utils/categories");

const Language = require("./models/Language");
const languageData = require("./utils/language");

const Currency = require("./models/Currency");
const currencyData = require("./utils/currency");

const Attribute = require("./models/Attribute");
const attributeData = require("./utils/attributes");

const Coupon = require("./models/Coupon");
const couponData = require("./utils/coupon");

const Unit = require("./models/Unit");

const fixAndImportData = async () => {
  try {
    console.log('Connecting to MongoDB cluster...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ MongoDB connected successfully!');

    console.log('\n=== IMPORTING BASIC DATA ===');

    // Import languages
    console.log('Importing languages...');
    await Language.deleteMany();
    await Language.insertMany(languageData);
    console.log('✅ Languages imported');

    // Import currencies
    console.log('Importing currencies...');
    await Currency.deleteMany();
    await Currency.insertMany(currencyData);
    console.log('✅ Currencies imported');

    // Import attributes
    console.log('Importing attributes...');
    await Attribute.deleteMany();
    await Attribute.insertMany(attributeData);
    console.log('✅ Attributes imported');

    // Import categories
    console.log('Importing categories...');
    await Category.deleteMany();
    await Category.insertMany(categoryData);
    console.log('✅ Categories imported');

    // Get a basic unit for products
    console.log('Getting basic unit for products...');
    let basicUnit = await Unit.findOne({ name: "Piece" });
    if (!basicUnit) {
      // Create a basic unit if it doesn't exist
      basicUnit = new Unit({
        name: "Piece",
        nameAr: "قطعة",
        shortCode: "pc",
        type: "base",
        isBase: true,
        isParent: true,
        status: "show"
      });
      await basicUnit.save();
      console.log('✅ Created basic unit');
    } else {
      console.log('✅ Found existing basic unit');
    }

    // Fix and import products
    console.log('Fixing and importing products...');
    await Product.deleteMany();
    
    const fixedProducts = productData.map(product => {
      // Extract price from prices object
      const price = product.prices?.price || 0;
      
      // Fix the product structure
      return {
        ...product,
        price: price, // Add required price field
        basicUnit: basicUnit._id, // Add required basicUnit field
        // Remove the nested prices object to avoid conflicts
        prices: {
          price: price,
          originalPrice: product.prices?.originalPrice || price,
          discount: product.prices?.discount || 0,
        }
      };
    });

    await Product.insertMany(fixedProducts);
    console.log(`✅ Products imported (${fixedProducts.length} products)`);

    // Import coupons
    console.log('Importing coupons...');
    await Coupon.deleteMany();
    await Coupon.insertMany(couponData);
    console.log('✅ Coupons imported');

    // Update admin (don't delete, just update)
    console.log('Updating admin...');
    await Admin.deleteMany();
    await Admin.insertMany(adminData);
    console.log('✅ Admin updated');

    console.log('\n=== DATA IMPORT COMPLETED ===');
    console.log('✅ All basic data has been imported to your cluster!');

  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

fixAndImportData(); 