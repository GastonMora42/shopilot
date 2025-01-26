// api/users/tickets/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { authOptions } from '@/app/lib/auth';

interface QRTicketResponse {
  subTicketId: string;
  qrCode: string;
  qrValidation: string;
  status: string;
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface BaseTicketResponse {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  eventType: 'SEATED' | 'GENERAL';
  status: string;
  price: number;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  createdAt: string;
  qrTickets: QRTicketResponse[];
}

interface SeatedTicketResponse extends BaseTicketResponse {
  eventType: 'SEATED';
  seats: string[];
}

interface GeneralTicketResponse extends BaseTicketResponse {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
}

type FormattedTicket = SeatedTicketResponse | GeneralTicketResponse;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();

    const tickets = await Ticket.find({ 
      userId: session.user.id 
    })
    .populate({
      path: 'eventId',
      select: 'name date location imageUrl'
    })
    .sort({ createdAt: -1 });

    // Formatear la respuesta con los QRs individuales
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      eventName: ticket.eventId.name,
      eventDate: ticket.eventId.date,
      eventLocation: ticket.eventId.location,
      eventImage: ticket.eventId.imageUrl,
      eventType: ticket.eventType,
      ...(ticket.eventType === 'SEATED' 
        ? { seats: ticket.seats }
        : {
            ticketType: ticket.ticketType,
            quantity: ticket.quantity
          }
      ),
      status: ticket.status,
      price: ticket.price,
      buyerInfo: ticket.buyerInfo,
      createdAt: ticket.createdAt,
      // Formatear QRs individuales
      qrTickets: ticket.qrTickets.map((qr: { qrMetadata: { subTicketId: any; status: any; type: any; seatInfo: { seat: any; }; generalInfo: { ticketType: any; index: any; }; }; qrCode: any; qrValidation: any; }) => ({
        subTicketId: qr.qrMetadata.subTicketId,
        qrCode: qr.qrCode,
        qrValidation: qr.qrValidation,
        status: qr.qrMetadata.status,
        type: qr.qrMetadata.type,
        ...(ticket.eventType === 'SEATED'
          ? {
              seatInfo: {
                seat: qr.qrMetadata.seatInfo?.seat
              }
            }
          : {
              generalInfo: {
                ticketType: qr.qrMetadata.generalInfo?.ticketType,
                index: qr.qrMetadata.generalInfo?.index
              }
            }
        )
      }))
    }));

    // Log para debugging
    console.log('Tickets formateados:', formattedTickets.map(t => ({
      id: t.id,
      status: t.status,
      qrTickets: t.qrTickets.map((qr: { subTicketId: any; status: any; type: any; }) => ({
        subTicketId: qr.subTicketId,
        status: qr.status,
        type: qr.type
      }))
    })));

    return NextResponse.json(formattedTickets);

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener tickets',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Utilidad para validar el estado de los QRs
function getTicketOverallStatus(qrTickets: QRTicketResponse[]): string {
  if (qrTickets.every(qr => qr.status === 'USED')) {
    return 'USED';
  }
  if (qrTickets.every(qr => qr.status === 'CANCELLED')) {
    return 'CANCELLED';
  }
  if (qrTickets.every(qr => qr.status === 'PAID')) {
    return 'PAID';
  }
  if (qrTickets.every(qr => qr.status === 'PENDING')) {
    return 'PENDING';
  }
  // Si hay estados mixtos, mostramos el estado más relevante
  if (qrTickets.some(qr => qr.status === 'PAID')) {
    return 'PARTIALLY_USED';
  }
  return 'MIXED';
}