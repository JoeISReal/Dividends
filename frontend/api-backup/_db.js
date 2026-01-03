
import { MongoClient } from 'mongodb';

// Connection String from User (Brackets removed from password)
const uri = "mongodb+srv://bradfordjoseph19_db_user:0UIprUf3Jl3AH4mx@dividends.xramlsf.mongodb.net/?retryWrites=true&w=majority&appName=Dividends";
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  // Fallback if not in env (for this prototype)
  process.env.MONGODB_URI = uri;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Helper to get the Database
export async function getDB() {
  const client = await clientPromise;
  return client.db('dividends_game');
}
