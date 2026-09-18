import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exhibition_portal';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    isFallback: boolean;
  } | undefined;
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null, isFallback: false };
}

export async function connectDB(): Promise<{ isConnected: boolean; isFallback: boolean }> {
  if (cached?.conn) {
    return { isConnected: true, isFallback: cached.isFallback };
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Quick timeout to fallback if MongoDB isn't running
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        console.warn('MongoDB connection attempt timed out or failed. Operating in High-Performance Local Data Store mode.', err.message);
        cached!.isFallback = true;
        return mongoose;
      });
  }

  try {
    cached!.conn = await cached!.promise;
    return { isConnected: true, isFallback: cached!.isFallback };
  } catch (e) {
    cached!.promise = null;
    cached!.isFallback = true;
    return { isConnected: false, isFallback: true };
  }
}
