// Script to fix duplicate product units by making unitType values unique
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Function to find and fix duplicate product units
const fixDuplicateProductUnits = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectDB();
    const db = conn.connection.db;
    const productUnitsCollection = db.collection('productunits');
    
    // First, let's list all indexes to understand what we're working with
    console.log('Listing current indexes...');
    const indexes = await productUnitsCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Option 1: Drop the problematic index (if we decide multiple units with same type/value are allowed)
    // Uncomment the next line to drop the index instead of updating duplicates
    // await productUnitsCollection.dropIndex('productId_1_unitType_1_unitValue_1');
    
    // Option 2: Find and update duplicate units to make them unique
    console.log('Finding duplicate product units...');
    
    // Get all product units
    const allUnits = await productUnitsCollection.find({}).toArray();
    console.log(`Total product units: ${allUnits.length}`);
    
    // Group by productId + unitType + unitValue
    const groupedUnits = {};
    allUnits.forEach(unit => {
      const key = `${unit.productId}_${unit.unitType || 'null'}_${unit.unitValue}`;
      if (!groupedUnits[key]) {
        groupedUnits[key] = [];
      }
      groupedUnits[key].push(unit);
    });
    
    // Find duplicate groups (more than 1 unit with same key)
    const duplicateGroups = Object.entries(groupedUnits)
      .filter(([key, units]) => units.length > 1)
      .map(([key, units]) => units);
    
    console.log(`Found ${duplicateGroups.length} groups of duplicate units`);
    
    // For each duplicate group, keep the first one and update others
    let updateCount = 0;
    for (const group of duplicateGroups) {
      console.log(`Processing duplicate group with ${group.length} units`);
      
      // Keep the first unit as is
      const baseUnit = group[0];
      console.log(`Base unit: ID=${baseUnit._id}, type=${baseUnit.unitType}, value=${baseUnit.unitValue}`);
      
      // Update others to make them unique
      for (let i = 1; i < group.length; i++) {
        const unitToUpdate = group[i];
        const newUnitType = `${unitToUpdate.unitType || 'multi'}-${i}`;
        
        console.log(`Updating unit ID=${unitToUpdate._id} from type=${unitToUpdate.unitType} to ${newUnitType}`);
        
        const result = await productUnitsCollection.updateOne(
          { _id: unitToUpdate._id },
          { $set: { unitType: newUnitType } }
        );
        
        updateCount += result.modifiedCount;
      }
    }
    
    console.log(`Updated ${updateCount} duplicate product units`);
    console.log('Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing duplicate product units:', error.message);
    process.exit(1);
  }
};

// Run the script
fixDuplicateProductUnits(); 