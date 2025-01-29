// src/scripts/initCreditPackages.ts
import mongoose from 'mongoose';
import { CreditPackage } from '../app/models/Credit.js';

const MONGODB_URI = 'mongodb+srv://gastonmora1742:5YOkjCJs3UxUBwUs@shopilot-cluster.jk2qs.mongodb.net/'

async function initCreditPackages() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');
    
    await CreditPackage.deleteMany({});
    console.log('Paquetes anteriores eliminados');
    
    const result = await CreditPackage.insertMany([
      {
        name: 'Starter',
        credits: 200,
        price: 33800,
        imageUrl: '/credits/starter.png'
      },
      {
        name: 'Profesional',
        credits: 300,
        price: 44700,
        imageUrl: '/public/21off.png'
      },
      {
        name: 'Enterprise',
        credits: 1000,
        price: 109000,
        imageUrl: '/public/42off.png'
      }
    ]);
    
    console.log(`${result.length} paquetes de créditos inicializados correctamente`);
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar paquetes:', error);
    process.exit(1);
  }
}

initCreditPackages();