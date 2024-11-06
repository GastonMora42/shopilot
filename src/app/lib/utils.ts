// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

// Para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Para formatear fechas
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })
}

// Para generar códigos QR
export async function generateQRCode(): Promise<string> {
  // Generar un string aleatorio único
  const randomString = crypto.randomBytes(32).toString('hex');
  
  // Agregar timestamp para mayor unicidad
  const timestamp = Date.now().toString();
  
  // Combinar y hacer hash
  return crypto
    .createHash('sha256')
    .update(randomString + timestamp)
    .digest('hex');
}

// Para generar un slug único
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// lib/utils.ts
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};