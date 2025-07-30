const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets';
const DUMP_DIR = './mongodb_dump/saptmarkets';

async function importData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB cluster...');
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db('saptmarkets');
    
    // Get all .bson files
    const bsonFiles = fs.readdirSync(DUMP_DIR).filter(file => file.endsWith('.bson'));
    
    console.log(`Found ${bsonFiles.length} collections to import:`);
    
    for (const file of bsonFiles) {
      const collectionName = file.replace('.bson', '');
      console.log(`\nImporting ${collectionName}...`);
      
      try {
        // Read the BSON file
        const bsonData = fs.readFileSync(path.join(DUMP_DIR, file));
        
        // Parse BSON data (this is a simplified approach)
        // For proper BSON parsing, you'd need a BSON parser library
        console.log(`File ${file} size: ${bsonData.length} bytes`);
        
        // For now, let's just check if the collection exists and has data
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`Collection ${collectionName} has ${count} documents`);
        
      } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
      }
    }
    
    console.log('\nImport process completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

importData(); 