// app/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

// Definir interface para el cache global
interface GlobalMongoDB {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// Definir tipo para la conexión
type Connection = typeof mongoose;

// Declarar el tipo global
declare global {
  var mongoose: GlobalMongoDB | undefined;
}

// Inicializar el cache
const cached: GlobalMongoDB = global.mongoose ?? {
  conn: null,
  promise: null,
};

// Asignar al global si no existe
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;