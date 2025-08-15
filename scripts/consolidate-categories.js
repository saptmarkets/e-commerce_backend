const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Safety: set DRY_RUN=true to preview changes only
const DRY_RUN = false; // Set to true to preview without changing

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

function normalizeName(category) {
	const en = (category.name && category.name.en) ? String(category.name.en).trim().toLowerCase() : '';
	const ar = (category.name && category.name.ar) ? String(category.name.ar).trim().toLowerCase() : '';
	return en || ar || ''; // prefer EN; fallback to AR
}

async function getDirectProductCount(categoryId) {
	const [count1, count2] = await Promise.all([
		Product.countDocuments({ category: categoryId }),
		Product.countDocuments({ categories: categoryId })
	]);
	return count1 + count2;
}

async function rewireProductsAndChildren(duplicateId, primaryId) {
	// 1) Rewire child categories' parentId
	await Category.updateMany(
		{ parentId: duplicateId.toString() },
		{ $set: { parentId: primaryId.toString() } }
	);

	// 2) Rewire products.category
	await Product.updateMany(
		{ category: duplicateId },
		{ $set: { category: primaryId } }
	);

	// 3) Rewire products.categories array
	await Product.updateMany(
		{ categories: duplicateId },
		{ $addToSet: { categories: primaryId } }
	);
	await Product.updateMany(
		{ categories: duplicateId },
		{ $pull: { categories: duplicateId } }
	);
}

async function consolidate() {
	await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
	console.log('✅ Connected to MongoDB');

	const allCategories = await Category.find({ status: 'show' }).lean();
	console.log(`📦 Loaded ${allCategories.length} active categories`);

	// Group by key: normalizedName + parentId (string or empty)
	const groups = new Map();
	for (const cat of allCategories) {
		const normalized = normalizeName(cat);
		const parentKey = (cat.parentId || '').toString();
		const key = `${normalized}::${parentKey}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(cat);
	}

	let totalGroupsWithDuplicates = 0;
	let totalRemoved = 0;
	let totalRewiredProducts = 0;

	for (const [key, cats] of groups.entries()) {
		if (cats.length <= 1) continue;
		totalGroupsWithDuplicates++;

		// Score categories to choose primary
		const scored = [];
		for (const cat of cats) {
			const productCount = await getDirectProductCount(cat._id);
			const childCount = allCategories.filter(c => (c.parentId || '') === cat._id.toString()).length;
			scored.push({ cat, productCount, childCount, createdAt: new Date(cat.createdAt || 0) });
		}
		scored.sort((a,b)=>{
			if (b.productCount !== a.productCount) return b.productCount - a.productCount;
			if (b.childCount !== a.childCount) return b.childCount - a.childCount;
			return a.createdAt - b.createdAt; // oldest first
		});

		const primary = scored[0].cat;
		const duplicates = scored.slice(1).map(s => s.cat);

		console.log(`\n🔧 Consolidating group: ${key}`);
		console.log(`   → Primary: ${primary._id} name=${JSON.stringify(primary.name)} parentId=${primary.parentId || 'None'}`);
		for (const s of scored) {
			console.log(`     - Candidate ${s.cat._id}: products=${s.productCount}, children=${s.childCount}, createdAt=${s.createdAt.toISOString()}`);
		}

		for (const dup of duplicates) {
			console.log(`   ↪ Rewiring duplicate ${dup._id} → primary ${primary._id}`);
			if (!DRY_RUN) {
				await rewireProductsAndChildren(dup._id, primary._id);
				const beforeDeleteChildren = await Category.countDocuments({ parentId: dup._id.toString() });
				const beforeDeleteP1 = await Product.countDocuments({ category: dup._id });
				const beforeDeleteP2 = await Product.countDocuments({ categories: dup._id });
				const delRes = await Category.deleteOne({ _id: dup._id });
				console.log(`     Deleted duplicate ${dup._id} (ack=${delRes.acknowledged})`);
				totalRemoved += delRes.deletedCount || 0;
				totalRewiredProducts += (beforeDeleteP1 + beforeDeleteP2);
			} else {
				console.log('     (dry-run) Would rewire children/products and delete');
			}
		}
	}

	console.log('\n====================================');
	console.log(`📊 Groups with duplicates: ${totalGroupsWithDuplicates}`);
	console.log(`🗑️  Categories removed: ${totalRemoved}`);
	console.log(`🔗 Products rewired (approx direct refs): ${totalRewiredProducts}`);
	console.log('====================================\n');

	await mongoose.connection.close();
	console.log('🔌 Disconnected from MongoDB');
}

consolidate().catch(err=>{ console.error('❌ Error consolidating:', err); process.exit(1); }); 