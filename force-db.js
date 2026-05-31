const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('dotenvnest');
    const hash = await bcrypt.hash('Password123!', 14);
    await db.collection('users').updateOne(
      { email: 'saif.dev77@gmail.com' },
      { $set: { isVerified: false, password: hash } }
    );
    console.log("Updated DB");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
