const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://asadji10001:a3BTsHNptI7dhk9G@saptmarkets.ipkaggw.mongodb.net/?retryWrites=true&w=majority&appName=saptmarkets';

async function checkProductStatuses() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB cluster...');
    await client.connect();
    console.log('Connected successfully!');
    
    const db = client.db('saptmarkets');
    const productsCollection = db.collection('products');
    
    // Count total products
    const totalProducts = await productsCollection.countDocuments();
    console.log(`Total products: ${totalProducts}`);
    
    // Count products by status
    const statusCounts = await productsCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('\nProducts by status:');
    statusCounts.forEach(status => {
      console.log(`${status._id || 'no status'}: ${status.count} products`);
    });
    
    // Show sample products with different statuses
    console.log('\nSample products with different statuses:');
    const sampleProducts = await productsCollection.find({}, { 
      projection: { title: 1, status: 1, _id: 0 } 
    }).limit(10).toArray();
    
    sampleProducts.forEach(product => {
      console.log(`- ${product.title?.en || product.title || 'No title'}: ${product.status || 'no status'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkProductStatuses(); 