// app/lib/qrGenerator.ts
import crypto from 'crypto';

interface QRGeneratorOptions {
  ticketId: string;
  eventType: 'SEATED' | 'GENERAL';
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
  index?: number; // Añadimos esta propiedad
}

// Esta será la única estructura de QR que usaremos en toda la app
export interface QRData {
  ticketId: string;
  validationHash: string;
  timestamp: number;
  type: 'SEATED' | 'GENERAL';
  metadata: {
    eventType: 'SEATED' | 'GENERAL';
    seatInfo?: {
      seats: string[];
    };
    generalInfo?: {
      ticketType: string;
      quantity: number;
    };
  };
}

export function generateTicketQR(options: QRGeneratorOptions): {
  qrData: QRData;
  qrString: string;
  validationHash: string;
} {
  const timestamp = Date.now();
  
  // Creamos la estructura base del QR
  const qrData: QRData = {
    ticketId: options.ticketId,
    timestamp,
    type: options.eventType,
    metadata: {
      eventType: options.eventType,
      ...(options.eventType === 'SEATED' 
        ? {
            seatInfo: {
              seats: options.seats || []
            }
          }
        : {
            generalInfo: {
              ticketType: options.ticketType?.name || '',
              quantity: options.quantity || 0
            }
          })
    },
    validationHash: '' // Se llenará después
  };

  // Generamos el hash de validación
  const validationHash = crypto
    .createHash('sha256')
    .update(`${options.ticketId}-${timestamp}-${JSON.stringify(qrData.metadata)}`)
    .digest('hex');

  qrData.validationHash = validationHash;

  // Generamos el string del QR
  const qrString = JSON.stringify(qrData);

  return {
    qrData,
    qrString,
    validationHash
  };
}

// Función de validación que usaremos en toda la app
export function validateQR(qrString: string): {
  isValid: boolean;
  data?: QRData;
  error?: string;
} {
  try {
    const qrData = JSON.parse(qrString) as QRData;
    
    // Recreamos el hash para validar
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${qrData.ticketId}-${qrData.timestamp}-${JSON.stringify(qrData.metadata)}`)
      .digest('hex');

    if (expectedHash !== qrData.validationHash) {
      return { isValid: false, error: 'QR inválido o manipulado' };
    }

    return { isValid: true, data: qrData };
  } catch (error) {
    return { isValid: false, error: 'Formato de QR inválido' };
  }
}