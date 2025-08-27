const mongoose = require('mongoose');
const Category = require('./models/Category');

// Connect to MongoDB using the user's connection string
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkDuplicates() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Wait for connection to be ready
    await new Promise((resolve, reject) => {
      mongoose.connection.once('open', resolve);
      mongoose.connection.on('error', reject);
    });
    
    console.log('✅ Connected to MongoDB successfully!\n');

    console.log('🔍 CHECKING FOR DUPLICATED CATEGORIES:');
    console.log('=====================================\n');

    // Get all categories
    const allCategories = await Category.find({ status: 'show' }).lean();
    console.log(`Total active categories: ${allCategories.length}\n`);

    // Group categories by name (English and Arabic)
    const categoriesByName = {};
    const categoriesBySlug = {};
    const potentialDuplicates = [];

    allCategories.forEach(category => {
      const englishName = category.name?.en?.toLowerCase().trim();
      const arabicName = category.name?.ar?.toLowerCase().trim();
      const slug = category.slug?.toLowerCase().trim();
      
      if (englishName) {
        if (!categoriesByName[englishName]) {
          categoriesByName[englishName] = [];
        }
        categoriesByName[englishName].push(category);
      }
      
      if (arabicName) {
        if (!categoriesByName[arabicName]) {
          categoriesByName[arabicName] = [];
        }
        categoriesByName[arabicName].push(category);
      }
      
      if (slug) {
        if (!categoriesBySlug[slug]) {
          categoriesBySlug[slug] = [];
        }
        categoriesBySlug[slug].push(category);
      }
    });

    // Check for duplicates by English name
    console.log('📋 DUPLICATES BY ENGLISH NAME:');
    console.log('==============================');
    
    let totalEnglishDuplicates = 0;
    Object.entries(categoriesByName).forEach(([name, categories]) => {
      if (categories.length > 1) {
        totalEnglishDuplicates++;
        console.log(`\n🔴 "${name}" (${categories.length} duplicates):`);
        
        categories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ID: ${cat._id}`);
          console.log(`     Name: ${JSON.stringify(cat.name)}`);
          console.log(`     Slug: ${cat.slug || 'No slug'}`);
          console.log(`     ParentId: ${cat.parentId || 'None'}`);
          console.log(`     Status: ${cat.status}`);
          console.log(`     Created: ${cat.createdAt}`);
          
          // Check if this category has subcategories
          const hasSubcategories = allCategories.some(c => c.parentId === cat._id.toString());
          console.log(`     Has Subcategories: ${hasSubcategories ? 'Yes' : 'No'}`);
          
          // Check if this category has products (we'll need to check this separately)
          console.log('');
        });
      }
    });
    
    console.log(`\n📊 Total English name duplicates: ${totalEnglishDuplicates}`);

    // Check for duplicates by Arabic name
    console.log('\n\n📋 DUPLICATES BY ARABIC NAME:');
    console.log('==============================');
    
    let totalArabicDuplicates = 0;
    Object.entries(categoriesByName).forEach(([name, categories]) => {
      if (categories.length > 1) {
        totalArabicDuplicates++;
        console.log(`\n🔴 "${name}" (${categories.length} duplicates):`);
        
        categories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ID: ${cat._id}`);
          console.log(`     Name: ${JSON.stringify(cat.name)}`);
          console.log(`     Slug: ${cat.slug || 'No slug'}`);
          console.log(`     ParentId: ${cat.parentId || 'None'}`);
          console.log(`     Status: ${cat.status}`);
          console.log(`     Created: ${cat.createdAt}`);
          console.log('');
        });
      }
    });
    
    console.log(`\n📊 Total Arabic name duplicates: ${totalArabicDuplicates}`);

    // Check for duplicates by slug
    console.log('\n\n📋 DUPLICATES BY SLUG:');
    console.log('======================');
    
    let totalSlugDuplicates = 0;
    Object.entries(categoriesBySlug).forEach(([slug, categories]) => {
      if (categories.length > 1) {
        totalSlugDuplicates++;
        console.log(`\n🔴 Slug "${slug}" (${categories.length} duplicates):`);
        
        categories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ID: ${cat._id}`);
          console.log(`     Name: ${JSON.stringify(cat.name)}`);
          console.log(`     Slug: ${cat.slug || 'No slug'}`);
          console.log(`     ParentId: ${cat.parentId || 'None'}`);
          console.log(`     Status: ${cat.status}`);
          console.log(`     Created: ${cat.createdAt}`);
          console.log('');
        });
      }
    });
    
    console.log(`\n📊 Total slug duplicates: ${totalSlugDuplicates}`);

    // Check for categories with similar names (partial matches)
    console.log('\n\n📋 SIMILAR NAMES (POTENTIAL DUPLICATES):');
    console.log('==========================================');
    
    const similarNames = [];
    const processedNames = new Set();
    
    Object.keys(categoriesByName).forEach(name1 => {
      if (processedNames.has(name1)) return;
      
      const similar = [];
      Object.keys(categoriesByName).forEach(name2 => {
        if (name1 !== name2 && !processedNames.has(name2)) {
          // Check for partial matches
          if (name1.includes(name2) || name2.includes(name1)) {
            similar.push(name2);
          }
          // Check for common words
          const words1 = name1.split(/\s+/);
          const words2 = name2.split(/\s+/);
          const commonWords = words1.filter(word => words2.includes(word));
          if (commonWords.length >= 2 && commonWords.length >= Math.min(words1.length, words2.length) * 0.7) {
            similar.push(name2);
          }
        }
      });
      
      if (similar.length > 0) {
        similarNames.push({ name: name1, similar });
        processedNames.add(name1);
        similar.forEach(s => processedNames.add(s));
      }
    });
    
    similarNames.forEach(({ name, similar }) => {
      console.log(`\n🟡 "${name}" is similar to:`);
      similar.forEach(similarName => {
        console.log(`  - "${similarName}"`);
      });
    });
    
    console.log(`\n📊 Total similar name groups: ${similarNames.length}`);

    // Summary
    console.log('\n\n📊 DUPLICATE ANALYSIS SUMMARY:');
    console.log('================================');
    console.log(`Total Categories: ${allCategories.length}`);
    console.log(`English Name Duplicates: ${totalEnglishDuplicates}`);
    console.log(`Arabic Name Duplicates: ${totalArabicDuplicates}`);
    console.log(`Slug Duplicates: ${totalSlugDuplicates}`);
    console.log(`Similar Name Groups: ${similarNames.length}`);
    
    if (totalEnglishDuplicates > 0 || totalArabicDuplicates > 0 || totalSlugDuplicates > 0) {
      console.log('\n⚠️  RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. Review and consolidate duplicate categories');
      console.log('2. Ensure navigation points to the correct (working) categories');
      console.log('3. Consider merging subcategories from duplicate parents');
      console.log('4. Update product-category relationships after consolidation');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDuplicates(); 