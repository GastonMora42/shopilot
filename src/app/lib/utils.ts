// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

interface QROptions {
  prefix?: string;
  length?: number;
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface QRCodeResult {
  qrCode: string;
  validationHash: string;
  metadata: {
    timestamp: number;
    ticketId: string;
  };
}

interface QRMetadata {
  ticketId: string;
  timestamp: number;
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}


export async function generateQRCode(options: QROptions = { type: "SEATED" }): Promise<QRCodeResult> {
  const {
    prefix = '',
    length = 64,
    ticketId = '',
    type,
    seatInfo,
    generalInfo
  } = options;
  
  const metadata: QRMetadata = {
    ticketId,
    timestamp: Date.now(),
    type,
    ...(type === 'SEATED' ? { seatInfo } : { generalInfo })
  };

  const mainHash = crypto
    .createHash('sha256')
    .update(prefix + JSON.stringify(metadata))
    .digest('hex')
    .slice(0, length);

  const validationHash = crypto
    .createHash('sha256')
    .update(mainHash + JSON.stringify(metadata))
    .digest('hex')
    .slice(0, 32);

  return {
    qrCode: mainHash,
    validationHash,
    metadata
  };
}

// Tipos para las opciones de formateo de fecha
interface DateFormatOptions {
  weekday?: 'long' | 'short' | 'narrow';
  year?: 'numeric' | '2-digit';
  month?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
}


interface QROptions {
  prefix?: string;
  length?: number;
  ticketId?: string;  // Añadimos esta propiedad
}

// Para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Para formatear fechas con opciones personalizables
export function formatDate(
  date: string | Date | number,
  options: DateFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }
): string {
  const dateObject = new Date(date);
  if (isNaN(dateObject.getTime())) {
    throw new Error('Fecha inválida');
  }
  return dateObject.toLocaleDateString('es-AR', options);
}

// Para formatear solo la hora
export function formatTime(date: string | Date | number): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Para formatear solo la fecha
export function formatDateOnly(date: string | Date | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Para generar códigos QR con opciones
interface QROptions {
  prefix?: string;
  length?: number;
}

// Para generar un slug único con opciones
interface SlugOptions {
  lowercase?: boolean;
  separator?: string;
  maxLength?: number;
}

export function generateSlug(
  text: string, 
  options: SlugOptions = {}
): string {
  const {
    lowercase = true,
    separator = '-',
    maxLength = 100
  } = options;

  let slug = text
    .normalize('NFKD') // Normalizar caracteres unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, separator) // Reemplazar espacios con separador
    .replace(new RegExp(`\\${separator}+`, 'g'), separator); // Remover separadores duplicados

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Cortar al máximo largo especificado
  return slug.slice(0, maxLength);
}

// Para formatear moneda con opciones
interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = 'ARS',
    locale = 'es-AR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
}

// Función utilitaria para validar emails
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función utilitaria para validar DNI argentino
export function isValidDNI(dni: string): boolean {
  const dniRegex = /^[\d]{7,8}$/;
  return dniRegex.test(dni);
}

// Función utilitaria para validar teléfono argentino
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:(?:00)?549?)?0?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2})??\d{8}$/;
  return phoneRegex.test(phone);
}

// Función para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Función para generar un ID único
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Función para formatear números grandes
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('es-AR').format(number);
}

// Función para calcular tiempo restante
export function getTimeRemaining(endDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = new Date(endDate).getTime() - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds
  };
}

export const generateSeatId = (rowIndex: number, colIndex: number): string => {
  const rowLetter = String.fromCharCode(65 + rowIndex);
  const colNumber = colIndex + 1;
  return `${rowLetter}${colNumber}`;
};

export const parseSeatId = (seatId: string): { row: number, column: number } => {
  const rowLetter = seatId.charAt(0);
  const rowIndex = rowLetter.charCodeAt(0) - 65;
  const colIndex = parseInt(seatId.slice(1)) - 1;
  return { row: rowIndex, column: colIndex };
};