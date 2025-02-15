// app/lib/mongodb.ts
import mongoose from 'mongoose';

type MongooseConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: MongooseConnection | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI');
}

let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = {
    conn: null,
    promise: null
  };
}

async function dbConnect(retryCount = 3): Promise<typeof mongoose> {
  try {
    if (cached?.conn) {
      // Verificar si la conexión está activa
      if (cached.conn.connection.readyState === 1) {
        return cached.conn;
      }
      // Si no está activa, limpiar la conexión cached
      cached.conn = null;
      cached.promise = null;
    }

    if (!cached?.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
        w: 'majority'
      };

      cached!.promise = mongoose.connect(MONGODB_URI!);
    }

    try {
      cached!.conn = await cached!.promise;
      
      // Agregar listeners para manejar eventos de conexión
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB desconectado');
        cached!.conn = null;
        cached!.promise = null;
      });

      mongoose.connection.on('error', (error) => {
        console.error('Error en la conexión MongoDB:', error);
        cached!.conn = null;
        cached!.promise = null;
      });

      return cached!.conn;
    } catch (e) {
      cached!.promise = null;
      
      if (retryCount > 0) {
        console.log(`Reintentando conexión. Intentos restantes: ${retryCount - 1}`);
        // Esperar 2 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
        return dbConnect(retryCount - 1);
      }
      
      throw e;
    }
  } catch (error) {
    console.error('Error fatal conectando a MongoDB:', error);
    throw new Error('No se pudo establecer conexión con la base de datos después de múltiples intentos');
  }
}

export default dbConnect;