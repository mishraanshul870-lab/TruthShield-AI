import mongoose from 'mongoose';
import { getDbState, jsonDb } from './db.js';

let onScanMutationCallback = null;
export const registerScanMutationHook = (cb) => {
  onScanMutationCallback = cb;
};

// --- MONGOOSE SCHEMAS & MODELS ---

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const scanSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true }, // 'text', 'url', 'image', 'video'
  content: { type: String, required: true }, // pasted text, URL, or original file name
  prediction: { type: String, required: true }, // 'Real' or 'Fake'
  confidenceScore: { type: Number, required: true }, // 0 to 100
  riskLevel: { type: String, required: true }, // 'Low', 'Medium', 'High'
  credibilityScore: { type: Number, required: true }, // 0 to 100
  explanation: { type: String, required: true },
  suspiciousSentences: { type: Array, default: [] },
  manipulatedRegions: { type: Array, default: [] },
  factCheckReport: { type: Object, default: null },
  thumbnail: { type: String, default: '' },
  provider: { type: String, default: 'Gemini' },
  processingTime: { type: Number, default: 0 }, // milliseconds
  status: { type: String, default: 'success' }, // 'success' or 'failed'
  timeline: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

const UserModelMongo = mongoose.model('User', userSchema);
const ScanModelMongo = mongoose.model('Scan', scanSchema);

// --- JSON DB MOCK IMPLEMENTATION ---

class UserJsonModel {
  static async create(data) {
    const db = jsonDb.read();
    const newUser = {
      _id: 'u_' + Math.random().toString(36).substr(2, 9),
      username: data.username,
      email: data.email,
      password: data.password,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    jsonDb.write(db);
    return newUser;
  }

  static async findOne(query) {
    const db = jsonDb.read();
    return db.users.find(user => {
      for (let key in query) {
        if (user[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  static async findById(id) {
    const db = jsonDb.read();
    return db.users.find(user => user._id === id) || null;
  }
}

class ScanJsonModel {
  static async create(data) {
    const db = jsonDb.read();
    const newScan = {
      _id: 's_' + Math.random().toString(36).substr(2, 9),
      userId: data.userId,
      type: data.type,
      content: data.content,
      prediction: data.prediction,
      confidenceScore: Number(data.confidenceScore),
      riskLevel: data.riskLevel,
      credibilityScore: Number(data.credibilityScore),
      explanation: data.explanation,
      suspiciousSentences: data.suspiciousSentences || [],
      manipulatedRegions: data.manipulatedRegions || [],
      factCheckReport: data.factCheckReport || null,
      thumbnail: data.thumbnail || '',
      provider: data.provider || 'Gemini',
      processingTime: Number(data.processingTime) || 0,
      status: data.status || 'success',
      timeline: data.timeline || [],
      createdAt: new Date().toISOString(),
    };
    db.scans.push(newScan);
    jsonDb.write(db);
    return newScan;
  }

  static async find(query) {
    const db = jsonDb.read();
    let results = [];
    // Filter from end to start to naturally get descending order
    for (let i = db.scans.length - 1; i >= 0; i--) {
      const scan = db.scans[i];
      let match = true;
      for (let key in query) {
        if (scan[key] !== query[key]) {
          match = false;
          break;
        }
      }
      if (match) results.push(scan);
    }
    return results;
  }

  static async findById(id) {
    const db = jsonDb.read();
    return db.scans.find(scan => scan._id === id) || null;
  }

  static async deleteById(id) {
    const db = jsonDb.read();
    const idx = db.scans.findIndex(scan => scan._id === id);
    if (idx !== -1) {
      db.scans.splice(idx, 1);
      jsonDb.write(db);
      return true;
    }
    return false;
  }

  static async deleteMany(query) {
    const db = jsonDb.read();
    const before = db.scans.length;
    db.scans = db.scans.filter(scan => {
      for (let key in query) {
        if (scan[key] !== query[key]) return true;
      }
      return false;
    });
    jsonDb.write(db);
    return { deletedCount: before - db.scans.length };
  }
}

// --- DYNAMIC DISPATCHER ---

export const User = {
  create: async (data) => {
    return getDbState().isMongoConnected ? await UserModelMongo.create(data) : await UserJsonModel.create(data);
  },
  findOne: async (query) => {
    return getDbState().isMongoConnected ? await UserModelMongo.findOne(query) : await UserJsonModel.findOne(query);
  },
  findById: async (id) => {
    return getDbState().isMongoConnected ? await UserModelMongo.findById(id) : await UserJsonModel.findById(id);
  },
  updateOne: async (id, updateData) => {
    if (getDbState().isMongoConnected) {
      return await UserModelMongo.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const db = jsonDb.read();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updateData };
        jsonDb.write(db);
        return db.users[idx];
      }
      return null;
    }
  },
  countDocuments: async () => {
    if (getDbState().isMongoConnected) {
      return await UserModelMongo.countDocuments();
    } else {
      const db = jsonDb.read();
      return db.users.length;
    }
  }
};

export const Scan = {
  create: async (data) => {
    const res = getDbState().isMongoConnected ? await ScanModelMongo.create(data) : await ScanJsonModel.create(data);
    if (onScanMutationCallback) onScanMutationCallback();
    return res;
  },
  find: async (query) => {
    return getDbState().isMongoConnected ? await ScanModelMongo.find(query).sort({ createdAt: -1 }) : await ScanJsonModel.find(query);
  },
  findById: async (id) => {
    return getDbState().isMongoConnected ? await ScanModelMongo.findById(id) : await ScanJsonModel.findById(id);
  },
  countDocuments: async (query = {}) => {
    if (getDbState().isMongoConnected) {
      return await ScanModelMongo.countDocuments(query);
    } else {
      const db = jsonDb.read();
      if (Object.keys(query).length === 0) return db.scans.length;
      return db.scans.filter(scan => {
        for (let key in query) {
          if (scan[key] !== query[key]) return false;
        }
        return true;
      }).length;
    }
  },
  aggregate: async (pipeline) => {
    if (getDbState().isMongoConnected) {
      return await ScanModelMongo.aggregate(pipeline);
    }
    // Aggregation not supported on JSON DB — return empty array
    return [];
  },
  deleteById: async (id) => {
    const res = getDbState().isMongoConnected ? await ScanModelMongo.findByIdAndDelete(id) : await ScanJsonModel.deleteById(id);
    if (onScanMutationCallback) onScanMutationCallback();
    return res;
  },
  deleteMany: async (query) => {
    const res = getDbState().isMongoConnected ? await ScanModelMongo.deleteMany(query) : await ScanJsonModel.deleteMany(query);
    if (onScanMutationCallback) onScanMutationCallback();
    return res;
  }
};

// Export raw Mongoose model for direct aggregate access when needed
export { ScanModelMongo };
