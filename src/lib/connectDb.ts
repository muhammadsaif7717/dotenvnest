import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined in .env.local");
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 30000,
};

let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development, reuse the cached client across HMR reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().then((c) => {
      console.log("✅ MongoDB connected (development)");
      return c;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a fresh client
  const client = new MongoClient(uri, options);
  clientPromise = client.connect().then((c) => {
    console.log("✅ MongoDB connected (production)");
    return c;
  });
}

export default clientPromise;

/** Database name used across the entire app */
export const dbName = "dotenvnest";
