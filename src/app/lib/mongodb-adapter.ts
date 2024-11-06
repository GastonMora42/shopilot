// src/app/lib/mongodb-adapter.ts
import { MongoClient } from 'mongodb';

// Definimos nuestro tipo global sin depender de NodeJS.Global
interface GlobalMongo {
  _mongoClientPromise?: Promise<MongoClient>;
  [key: string]: any;
}

// Declaramos el global con nuestro tipo
declare const global: GlobalMongo;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const options: Record<string, any> = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

export default clientPromise;