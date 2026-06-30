import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isMongoConnected = false;
const JSON_DB_PATH = path.join(__dirname, '../database.json');

// Initialize local JSON DB if it doesn't exist
const initLocalDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify({ users: [], scans: [] }, null, 2));
    console.log('Initialized local JSON database fallback at:', JSON_DB_PATH);
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log('⚠️ MONGO_URI not found in env. Falling back to local JSON database.');
    initLocalDb();
    isMongoConnected = false;
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('🚀 Connected to MongoDB successfully.');
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    console.log('⚠️ Falling back to local JSON database.');
    initLocalDb();
    isMongoConnected = false;
    return false;
  }
};

export const getDbState = () => ({
  isMongoConnected,
  jsonDbPath: JSON_DB_PATH,
});

// JSON DB read/write helper functions with in-memory caching
let cachedData = null;

export const jsonDb = {
  read: () => {
    if (cachedData) return cachedData;
    try {
      initLocalDb();
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      cachedData = JSON.parse(data);
      return cachedData;
    } catch (err) {
      console.error('Error reading local database:', err);
      return { users: [], scans: [] };
    }
  },
  write: (data) => {
    cachedData = data;
    fs.writeFile(JSON_DB_PATH, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error writing to local database asynchronously:', err);
      }
    });
  }
};
