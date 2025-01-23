import { generateTicketQR } from "@/app/lib/qrGenerator";
import { ITicket } from "@/types";

// utils/qr.ts
export const getTicketQR = async (ticket: ITicket) => {
    if (ticket.qrCode) {
      return {
        qrCode: ticket.qrCode,
        qrValidation: ticket.qrValidation,
        qrMetadata: ticket.qrMetadata
      };
    }
  
    const { qrString, validationHash, qrData } = await generateTicketQR({
      ticketId: ticket._id.toString(),
      eventType: ticket.eventType,
      seats: ticket.seats,
      ticketType: ticket.ticketType,
      quantity: ticket.quantity
    });
  
    return {
      qrCode: qrString,
      qrValidation: validationHash,
      qrMetadata: qrData
    };
  };