import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn("MONGODB_URI not set. Audit log will stay in memory.");
}

let clientPromise: Promise<MongoClient> | null = null;

export const getMongoClient = async (): Promise<MongoClient> => {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (clientPromise) return clientPromise;
  clientPromise = new MongoClient(uri).connect();
  return clientPromise;
};

export const getDatabase = async () => {
  if (!uri) {
    return null; // Return null instead of throwing for graceful degradation
  }
  try {
    const client = await getMongoClient();
    // Extract database name from URI or use default
    // Support both mongodb:// and mongodb+srv:// formats
    // Format: mongodb[+srv]://[username:password@]host[:port][/database][?options]
    const match = uri.match(/\/\/(?:[^/]+@)?[^/]+(?:\/([^?]+))?/);
    const dbName = match?.[1] || "fleet_monitoring";
    return client.db(dbName);
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
};


