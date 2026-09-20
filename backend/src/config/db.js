// src/config/db.js
//
// Serverless-safe connection: Vercel reuses warm lambda instances, so the
// connection (and any in-flight connect attempt) is cached on `globalThis`
// to survive across invocations instead of re-handshaking with Atlas on
// every single request.

import mongoose from 'mongoose';

// Fail fast instead of silently buffering queries for bufferTimeoutMS (10s
// default) while the socket isn't ready — every route is gated by ensureDb()
// (see dbMiddleware.js) so this never fires on a healthy connection.
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const cache = (globalThis.__amsMongoose ??= { conn: null, promise: null });

// `mongodb+srv://` URIs resolve an SRV/TXT DNS record *before* the driver's
// own serverSelectionTimeoutMS starts counting — on a slow or filtered
// network that lookup alone can stall for 20s+, well past what's left of a
// Vercel function's budget. Race the whole handshake against a hard budget
// so a stuck DNS/network step still fails fast into a 503 instead of hanging.
const CONNECT_BUDGET_MS = 15000;

export const connectDB = async () => {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    const uri = process.env.Mongo_URI;
    if (!uri) throw new Error('Mongo_URI is not set');

    const attempt = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
      })
      .then((m) => {
        cache.conn = m;
        console.log('MONGODB CONNECTED SUCCESSFULLY ✅');
        return m;
      });

    const budget = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`MongoDB connect exceeded ${CONNECT_BUDGET_MS}ms budget`)), CONNECT_BUDGET_MS);
    });

    cache.promise = Promise.race([attempt, budget]).catch((error) => {
      cache.promise = null; // allow the next request to retry the handshake
      console.error('ERROR CONNECTING TO MONGODB', error.message);
      throw error;
    });
  }

  return cache.promise;
};

export const dbState = () => mongoose.connection.readyState;
