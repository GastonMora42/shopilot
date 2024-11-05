// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

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
  const uniqueId = uuidv4()
  try {
    const qrCode = await QRCode.toDataURL(uniqueId)
    return qrCode
  } catch (err) {
    console.error('Error generating QR code:', err)
    throw new Error('Error generating QR code')
  }
}

// Para generar un slug único
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}