// lib/qrGenerator.ts
import crypto from 'crypto';
import mongoose from 'mongoose';

interface QRGeneratorOptions {
  ticketId: string;
  eventType: 'SEATED' | 'GENERAL';
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
}

export interface QRData {
  ticketId: string;
  subTicketId: string;
  validationHash: string;
  timestamp: number;
  type: 'SEATED' | 'GENERAL';
  metadata: {
    eventType: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
}

export interface QRTicket {
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
}

function generateSingleQR(options: {
  ticketId: string;
  subTicketId: string;
  eventType: 'SEATED' | 'GENERAL';
  seatInfo?: { seat: string };
  generalInfo?: { ticketType: string; index: number };
}): QRTicket {
  const timestamp = Date.now();
  
  const qrMetadata = {
    timestamp,
    ticketId: options.ticketId,
    subTicketId: options.subTicketId,
    type: options.eventType,
    status: 'PENDING' as const,
    ...(options.eventType === 'SEATED' 
      ? { seatInfo: options.seatInfo }
      : { generalInfo: options.generalInfo }
    )
  };

  const validationHash = crypto
    .createHash('sha256')
    .update(`${options.ticketId}-${options.subTicketId}-${timestamp}-${JSON.stringify(qrMetadata)}`)
    .digest('hex');

  const qrData: QRData = {
    ticketId: options.ticketId,
    subTicketId: options.subTicketId,
    validationHash,
    timestamp,
    type: options.eventType,
    metadata: {
      eventType: options.eventType,
      status: 'PENDING',
      ...(options.eventType === 'SEATED' 
        ? { seatInfo: options.seatInfo }
        : { generalInfo: options.generalInfo }
      )
    }
  };

  return {
    qrCode: JSON.stringify(qrData),
    qrValidation: validationHash,
    qrMetadata: qrMetadata
  };
}

export async function generateTicketQRs(options: QRGeneratorOptions): Promise<QRTicket[]> {
  const qrTickets: QRTicket[] = [];
  
  if (options.eventType === 'SEATED') {
    // Generar un QR por asiento
    for (const seat of options.seats!) {
      const subTicketId = new mongoose.Types.ObjectId().toString();
      const qrTicket = generateSingleQR({
        ticketId: options.ticketId,
        subTicketId,
        eventType: 'SEATED',
        seatInfo: { seat }
      });
      qrTickets.push(qrTicket);
    }
  } else {
    // Generar QRs por cantidad de tickets generales
    for (let i = 0; i < options.quantity!; i++) {
      const subTicketId = new mongoose.Types.ObjectId().toString();
      const qrTicket = generateSingleQR({
        ticketId: options.ticketId,
        subTicketId,
        eventType: 'GENERAL',
        generalInfo: {
          ticketType: options.ticketType!.name,
          index: i
        }
      });
      qrTickets.push(qrTicket);
    }
  }
  
  return qrTickets;
}

export function validateQR(qrString: string): {
  isValid: boolean;
  data?: QRData;
  error?: string;
} {
  try {
    const qrData = JSON.parse(qrString) as QRData;
    
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${qrData.ticketId}-${qrData.subTicketId}-${qrData.timestamp}-${JSON.stringify(qrData.metadata)}`)
      .digest('hex');

    if (expectedHash !== qrData.validationHash) {
      return { isValid: false, error: 'QR inválido o manipulado' };
    }

    return { isValid: true, data: qrData };
  } catch (error) {
    return { isValid: false, error: 'Formato de QR inválido' };
  }
}