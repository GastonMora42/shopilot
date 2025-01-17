// src/scripts/initCreditPackages.ts
import mongoose from 'mongoose';
import { CreditPackage } from '../app/models/Credit';

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
        credits: 50,
        price: 1000
      },
      {
        name: 'Professional',
        credits: 200,
        price: 3500
      },
      {
        name: 'Enterprise',
        credits: 1000,
        price: 15000
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