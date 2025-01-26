// utils/qr.ts
import { generateTicketQRs } from "@/app/lib/qrGenerator";
import { ITicket } from "@/types";

interface QRTicket {
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

export const getTicketQRs = async (ticket: ITicket): Promise<QRTicket[]> => {
  // Si el ticket ya tiene QRs, retornarlos
  if (ticket.qrTickets && ticket.qrTickets.length > 0) {
    return ticket.qrTickets;
  }

  // Si no tiene QRs, generarlos según el tipo de ticket
  const qrTickets = await generateTicketQRs({
    ticketId: ticket._id.toString(),
    eventType: ticket.eventType,
    ...(ticket.eventType === 'SEATED' 
      ? { seats: ticket.seats }
      : {
          ticketType: ticket.ticketType,
          quantity: ticket.quantity
        }
    )
  });

  return qrTickets;
};

// Función auxiliar para obtener un QR específico
export const getSpecificQR = async (ticket: ITicket, subTicketId: string): Promise<QRTicket | null> => {
  const qrTickets = ticket.qrTickets || await getTicketQRs(ticket);
  return qrTickets.find((qr: { qrMetadata: { subTicketId: string; }; }) => qr.qrMetadata.subTicketId === subTicketId) || null;
};

// Función para validar el estado de un QR específico
export const isQRValid = (qrTicket: QRTicket): boolean => {
  return qrTicket.qrMetadata.status === 'PAID';
};

// Función para obtener el estado general del ticket basado en sus QRs
export const getTicketOverallStatus = (qrTickets: QRTicket[]): 'PENDING' | 'PAID' | 'USED' | 'CANCELLED' | 'PARTIALLY_USED' => {
  if (!qrTickets.length) return 'PENDING';

  const allUsed = qrTickets.every(qr => qr.qrMetadata.status === 'USED');
  const allCancelled = qrTickets.every(qr => qr.qrMetadata.status === 'CANCELLED');
  const allPaid = qrTickets.every(qr => qr.qrMetadata.status === 'PAID');
  const allPending = qrTickets.every(qr => qr.qrMetadata.status === 'PENDING');
  const someUsed = qrTickets.some(qr => qr.qrMetadata.status === 'USED');
  const somePaid = qrTickets.some(qr => qr.qrMetadata.status === 'PAID');

  if (allUsed) return 'USED';
  if (allCancelled) return 'CANCELLED';
  if (allPaid) return 'PAID';
  if (allPending) return 'PENDING';
  if (someUsed && somePaid) return 'PARTIALLY_USED';
  
  return 'PAID'; // Estado por defecto si hay mezcla de estados
};

// Función para obtener información formateada de un QR
export const formatQRInfo = (qrTicket: QRTicket) => {
  const baseInfo = {
    subTicketId: qrTicket.qrMetadata.subTicketId,
    status: qrTicket.qrMetadata.status,
    qrCode: qrTicket.qrCode,
    type: qrTicket.qrMetadata.type
  };

  if (qrTicket.qrMetadata.type === 'SEATED') {
    return {
      ...baseInfo,
      seat: qrTicket.qrMetadata.seatInfo?.seat
    };
  }

  return {
    ...baseInfo,
    ticketType: qrTicket.qrMetadata.generalInfo?.ticketType,
    index: qrTicket.qrMetadata.generalInfo?.index
  };
};