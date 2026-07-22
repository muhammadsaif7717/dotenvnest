const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not found");

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("dotenvnest");

    console.log("Creating unique index on users.email...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    console.log("Creating compound index on envs...");
    await db.collection("envs").createIndex({ userId: 1, createdAt: -1 });

    console.log("Indexes created successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
