import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || '';
if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('leads');

    console.log("Creating indexes for 'leads' collection...");

    // Text index for search
    await collection.createIndex({ 
      title: "text", 
      query: "text", 
      snippet: "text" 
    });

    // Single field indexes for sorting
    await collection.createIndex({ position: 1 });
    await collection.createIndex({ title: 1 });

    console.log("Indexes created successfully!");
  } catch (err) {
    console.error("Error creating indexes:", err);
  } finally {
    await client.close();
  }
}

run();
