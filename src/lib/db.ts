import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-elephant';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 2000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

// Database utilities
export const db = {
  connect: dbConnect,
  disconnect: async () => {
    if (cached!.conn) {
      await mongoose.disconnect();
      cached!.conn = null;
      cached!.promise = null;
    }
  }
};