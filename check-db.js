const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || "mongodb+srv://dotenvnest:dotenvnest123@cluster0.pogos.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // I will parse it from .env.local

require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('dotenvnest');
    const users = await db.collection('users').find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
