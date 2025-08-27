const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Connect to MongoDB using the user's connection string
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      mongoose.connection.once('open', resolve);
      mongoose.connection.on('error', reject);
    });
    
    console.log('✅ Connected to MongoDB successfully!\n');

    // Test 0: Check what databases and collections are available
    console.log('🔍 DATABASE DISCOVERY:');
    console.log('======================');
    
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('Available databases:');
    dbList.databases.forEach(db => {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    console.log(`\nCurrent database: ${mongoose.connection.db.databaseName}`);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\nCollections in current database (${collections.length}):`);
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 1: Check basic database contents
    console.log('📊 DATABASE OVERVIEW:');
    console.log('=====================');
    
    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();
    const activeCategories = await Category.countDocuments({ status: 'show' });
    const activeProducts = await Product.countDocuments({ status: 'show' });
    
    console.log(`Total Categories: ${totalCategories}`);
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Active Categories: ${activeCategories}`);
    console.log(`Active Products: ${activeProducts}\n`);

    // Test 2: Check the specific Deli Section categories
    console.log('🔍 DELI SECTION ANALYSIS:');
    console.log('========================');
    
    // The Deli Section that's being accessed (broken)
    const accessedDeliSection = await Category.findById('689cb22ffc3a4400485a3e05').lean();
    console.log('Accessed Deli Section (ID: 689cb22ffc3a4400485a3e05):');
    if (accessedDeliSection) {
      console.log(`  - Name: ${JSON.stringify(accessedDeliSection.name)}`);
      console.log(`  - ParentId: ${accessedDeliSection.parentId}`);
      console.log(`  - Status: ${accessedDeliSection.status}`);
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
    // The actual parent of Soft & Hard Cheeses
    const softHardCheeses = await Category.findById('689c6b259e326547f0af4639').lean();
    console.log('\nSoft & Hard Cheeses (ID: 689c6b259e326547f0af4639):');
    if (softHardCheeses) {
      console.log(`  - Name: ${JSON.stringify(softHardCheeses.name)}`);
      console.log(`  - ParentId: ${softHardCheeses.parentId}`);
      console.log(`  - Status: ${softHardCheeses.status}`);
    } else {
      console.log('  ❌ NOT FOUND');
    }
    
    // The actual parent category
    if (softHardCheeses && softHardCheeses.parentId) {
      const actualParent = await Category.findById(softHardCheeses.parentId).lean();
      console.log('\nActual Parent Category (ID: ' + softHardCheeses.parentId + '):');
      if (actualParent) {
        console.log(`  - Name: ${JSON.stringify(actualParent.name)}`);
        console.log(`  - ParentId: ${actualParent.parentId}`);
        console.log(`  - Status: ${actualParent.status}`);
      } else {
        console.log('  ❌ NOT FOUND');
      }
    }

    // Test 3: Check subcategories of both Deli Sections
    console.log('\n🔍 SUBCATEGORY ANALYSIS:');
    console.log('========================');
    
    // Subcategories of the accessed Deli Section
    const childrenOfAccessedDeli = await Category.find({ 
      parentId: '689cb22ffc3a4400485a3e05' 
    }).lean();
    console.log(`Subcategories of Accessed Deli Section (${childrenOfAccessedDeli.length} found):`);
    childrenOfAccessedDeli.forEach(sub => {
      console.log(`  - ${sub.name?.en || 'No name'}: ${sub._id}`);
    });
    
    // Subcategories of the actual parent
    if (softHardCheeses && softHardCheeses.parentId) {
      const childrenOfActualParent = await Category.find({ 
        parentId: softHardCheeses.parentId 
      }).lean();
      console.log(`\nSubcategories of Actual Parent (${childrenOfActualParent.length} found):`);
      childrenOfActualParent.forEach(sub => {
        console.log(`  - ${sub.name?.en || 'No name'}: ${sub._id}`);
      });
    }

    // Test 4: Check products in each category
    console.log('\n🔍 PRODUCT ANALYSIS:');
    console.log('====================');
    
    // Products in the accessed Deli Section
    const productsInAccessedDeli = await Product.find({
      $or: [
        { category: '689cb22ffc3a4400485a3e05' },
        { categories: '689cb22ffc3a4400485a3e05' }
      ],
      status: 'show'
    }).lean();
    console.log(`Products in Accessed Deli Section: ${productsInAccessedDeli.length}`);
    
    // Products in the actual parent category
    if (softHardCheeses && softHardCheeses.parentId) {
      const productsInActualParent = await Product.find({
        $or: [
          { category: softHardCheeses.parentId },
          { categories: softHardCheeses.parentId }
        ],
        status: 'show'
      }).lean();
      console.log(`Products in Actual Parent Category: ${productsInActualParent.length}`);
    }
    
    // Products in Soft & Hard Cheeses specifically
    const productsInSoftHardCheeses = await Product.find({
      $or: [
        { category: '689c6b259e326547f0af4639' },
        { categories: '689c6b259e326547f0af4639' }
      ],
      status: 'show'
    }).lean();
    console.log(`Products in Soft & Hard Cheeses: ${productsInSoftHardCheeses.length}`);

    // Test 5: Check all categories with similar names
    console.log('\n🔍 CATEGORY NAME ANALYSIS:');
    console.log('==========================');
    
    const allCategories = await Category.find({ status: 'show' }).lean();
    const deliLikeCategories = allCategories.filter(cat => 
      cat.name?.en?.toLowerCase().includes('deli') || 
      cat.name?.en?.toLowerCase().includes('section')
    );
    
    console.log(`Categories with 'deli' or 'section' in name (${deliLikeCategories.length} found):`);
    deliLikeCategories.forEach(cat => {
      console.log(`  - ${cat.name?.en || 'No name'}: ${cat._id} (Parent: ${cat.parentId || 'None'})`);
    });

    // Test 6: Check the complete category hierarchy
    console.log('\n🔍 COMPLETE CATEGORY HIERARCHY:');
    console.log('================================');
    
    const topLevelCategories = allCategories.filter(cat => !cat.parentId);
    console.log(`Top-level categories (${topLevelCategories.length} found):`);
    
    for (const topCat of topLevelCategories) {
      console.log(`\n📁 ${topCat.name?.en || 'No name'} (${topCat._id}):`);
      
      const level1Children = allCategories.filter(cat => cat.parentId === topCat._id.toString());
      for (const child1 of level1Children) {
        console.log(`  📂 ${child1.name?.en || 'No name'} (${child1._id}):`);
        
        const level2Children = allCategories.filter(cat => cat.parentId === child1._id.toString());
        for (const child2 of level2Children) {
          console.log(`    📄 ${child2.name?.en || 'No name'} (${child2._id})`);
        }
      }
    }

    // Test 7: Sample products to understand structure
    console.log('\n🔍 SAMPLE PRODUCTS:');
    console.log('===================');
    
    const sampleProducts = await Product.find({ status: 'show' })
      .populate('category', 'name _id')
      .populate('categories', 'name _id')
      .limit(5)
      .lean();
    
    console.log(`Sample products (${sampleProducts.length} found):`);
    sampleProducts.forEach((prod, index) => {
      console.log(`\n  Product ${index + 1}:`);
      console.log(`    - ID: ${prod._id}`);
      console.log(`    - Title: ${JSON.stringify(prod.title)}`);
      console.log(`    - Category: ${prod.category ? `${prod.category.name?.en} (${prod.category._id})` : 'None'}`);
      console.log(`    - Categories: ${prod.categories?.map(c => `${c.name?.en} (${c._id})`).join(', ') || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDatabase();