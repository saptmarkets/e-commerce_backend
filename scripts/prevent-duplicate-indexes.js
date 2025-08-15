const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/saptmarkets?retryWrites=true&w=majority&appName=saptmarkets';

async function ensureIndexes() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');

  // 1) Unique slug (if slug present)
  try {
    await Category.collection.createIndex(
      { slug: 1 },
      { unique: true, sparse: true, name: 'uniq_category_slug' }
    );
    console.log('✔️  Ensured unique sparse index on slug');
  } catch (e) {
    console.warn('⚠️  Could not create unique index on slug:', e.message);
  }

  // 2) Unique compound index on normalized English name + parentId
  // Because Category schema stores name as object, we add a synthetic index using a collation to case-insensitive compare "name.en"
  try {
    await Category.collection.createIndex(
      { 'name.en': 1, parentId: 1 },
      { unique: true, sparse: true, name: 'uniq_name_en_parent', collation: { locale: 'en', strength: 2 } }
    );
    console.log('✔️  Ensured unique sparse index on name.en + parentId (case-insensitive)');
  } catch (e) {
    console.warn('⚠️  Could not create unique index on name.en + parentId:', e.message);
  }

  // 3) Optional: enforce uniqueness on name.ar + parentId as well
  try {
    await Category.collection.createIndex(
      { 'name.ar': 1, parentId: 1 },
      { unique: true, sparse: true, name: 'uniq_name_ar_parent' }
    );
    console.log('✔️  Ensured unique sparse index on name.ar + parentId');
  } catch (e) {
    console.warn('⚠️  Could not create unique index on name.ar + parentId:', e.message);
  }

  await mongoose.connection.close();
  console.log('🔌 Disconnected from MongoDB');
}

ensureIndexes().catch(err=>{ console.error('❌ Error ensuring indexes:', err); process.exit(1); }); 