// app/lib/mongodb.ts
import mongoose from 'mongoose';

// Tipo para la conexión global de Mongoose
type MongooseConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Declaración del tipo global
declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: MongooseConnection | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Por favor define la variable de entorno MONGODB_URI'
  );
}

// Inicializar la conexión
let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = {
    conn: null,
    promise: null
  };
}

async function dbConnect(): Promise<typeof mongoose> {
  try {
    // Si ya existe una conexión, la retornamos
    if (cached?.conn) {
      return cached.conn;
    }

    // Si no hay una promesa de conexión pendiente, la creamos
    if (!cached?.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      };

      cached!.promise = mongoose.connect(MONGODB_URI!, opts);
    }

    // Esperamos la conexión y la guardamos
    try {
      cached!.conn = await cached!.promise;
    } catch (e) {
      cached!.promise = null;
      throw e;
    }

    return cached!.conn;
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw new Error('No se pudo conectar a la base de datos');
  }
}

export default dbConnect;