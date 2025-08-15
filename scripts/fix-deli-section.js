const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Safety: set DRY_RUN=true to preview changes only
const DRY_RUN = false; // Set to true to preview without changing

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

async function fixDeliSection() {
	await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
	console.log('✅ Connected to MongoDB');

	// Find the two DELI SECTION categories
	const deliCategories = await Category.find({ 
		'name.en': 'DELI SECTION',
		status: 'show'
	}).lean();
	
	console.log(`📦 Found ${deliCategories.length} DELI SECTION categories:`);
	
	for (const cat of deliCategories) {
		console.log(`   - ID: ${cat._id}, ParentId: ${cat.parentId || 'None'}, Slug: ${cat.slug}`);
	}

	if (deliCategories.length !== 2) {
		console.log('❌ Expected exactly 2 DELI SECTION categories, found:', deliCategories.length);
		await mongoose.connection.close();
		return;
	}

	// Determine which one to keep (the one with parentId and subcategories)
	const primaryDeli = deliCategories.find(cat => cat.parentId);
	const duplicateDeli = deliCategories.find(cat => !cat.parentId);

	if (!primaryDeli || !duplicateDeli) {
		console.log('❌ Could not identify primary vs duplicate DELI SECTION categories');
		await mongoose.connection.close();
		return;
	}

	console.log(`\n🔧 Primary DELI SECTION: ${primaryDeli._id} (with parentId: ${primaryDeli.parentId})`);
	console.log(`   Duplicate DELI SECTION: ${duplicateDeli._id} (no parentId)`);

	// Find subcategories of the duplicate
	const duplicateSubcategories = await Category.find({ 
		parentId: duplicateDeli._id.toString(),
		status: 'show'
	}).lean();

	console.log(`\n📋 Found ${duplicateSubcategories.length} subcategories under duplicate DELI SECTION:`);
	for (const sub of duplicateSubcategories) {
		console.log(`   - ${sub.name.en || sub.name.ar} (ID: ${sub._id})`);
	}

	// Find products directly linked to duplicate DELI SECTION
	const [productsWithCategory, productsWithCategories] = await Promise.all([
		Product.find({ category: duplicateDeli._id }).lean(),
		Product.find({ categories: duplicateDeli._id }).lean()
	]);

	console.log(`\n📦 Found ${productsWithCategory.length} products with category=${duplicateDeli._id}`);
	console.log(`📦 Found ${productsWithCategories.length} products with categories[]=${duplicateDeli._id}`);

	if (!DRY_RUN) {
		console.log('\n🔄 Starting consolidation...');

		// 1) Move subcategories from duplicate to primary
		if (duplicateSubcategories.length > 0) {
			await Category.updateMany(
				{ parentId: duplicateDeli._id.toString() },
				{ $set: { parentId: primaryDeli._id.toString() } }
			);
			console.log(`   ✅ Moved ${duplicateSubcategories.length} subcategories to primary DELI SECTION`);
		}

		// 2) Update products.category
		if (productsWithCategory.length > 0) {
			await Product.updateMany(
				{ category: duplicateDeli._id },
				{ $set: { category: primaryDeli._id } }
			);
			console.log(`   ✅ Updated ${productsWithCategory.length} products.category`);
		}

		// 3) Update products.categories array
		if (productsWithCategories.length > 0) {
			await Product.updateMany(
				{ categories: duplicateDeli._id },
				{ $addToSet: { categories: primaryDeli._id } }
			);
			await Product.updateMany(
				{ categories: duplicateDeli._id },
				{ $pull: { categories: duplicateDeli._id } }
			);
			console.log(`   ✅ Updated ${productsWithCategories.length} products.categories[]`);
		}

		// 4) Delete the duplicate DELI SECTION
		const deleteResult = await Category.deleteOne({ _id: duplicateDeli._id });
		console.log(`   ✅ Deleted duplicate DELI SECTION: ${deleteResult.deletedCount} categories removed`);

		console.log('\n🎉 DELI SECTION consolidation completed successfully!');
	} else {
		console.log('\n🔍 DRY RUN - No changes made. Would:');
		console.log(`   - Move ${duplicateSubcategories.length} subcategories to primary DELI SECTION`);
		console.log(`   - Update ${productsWithCategory.length} products.category`);
		console.log(`   - Update ${productsWithCategories.length} products.categories[]`);
		console.log(`   - Delete duplicate DELI SECTION ${duplicateDeli._id}`);
	}

	await mongoose.connection.close();
	console.log('🔌 Disconnected from MongoDB');
}

fixDeliSection().catch(err=>{ console.error('❌ Error fixing DELI SECTION:', err); process.exit(1); }); 