// app/api/users/tickets/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { authOptions } from '@/app/lib/auth';

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

   // Obtener tickets con información del evento
   const tickets = await Ticket.find({ 
     userId: session.user.id 
   })
   .populate({
     path: 'eventId',
     select: 'name date location imageUrl'
   })
   .sort({ createdAt: -1 });

   // Formatear la respuesta manteniendo consistencia con los QR
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
     // Información del QR completa
     qrCode: ticket.qrCode,
     qrValidation: ticket.qrValidation,
     qrMetadata: ticket.qrMetadata,
     price: ticket.price,
     buyerInfo: ticket.buyerInfo,
     createdAt: ticket.createdAt
   }));

   // Log para debugging
   console.log('Tickets formateados:', formattedTickets.map(t => ({
     id: t.id,
     status: t.status,
     qrCode: t.qrCode ? 'present' : 'missing',
     eventType: t.eventType
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

// Tipos para ayudar con el tipado
interface BaseTicket {
 id: string;
 eventName: string;
 eventDate: string;
 eventLocation: string;
 eventImage: string;
 eventType: 'SEATED' | 'GENERAL';
 status: string;
 qrCode: string;
 qrValidation: string;
 qrMetadata: {
   timestamp: number;
   ticketId: string;
   type: 'SEATED' | 'GENERAL';
 };
 price: number;
 buyerInfo: {
   name: string;
   email: string;
   dni: string;
   phone?: string;
 };
 createdAt: string;
}

interface SeatedTicket extends BaseTicket {
 eventType: 'SEATED';
 seats: string[];
 qrMetadata: {
   timestamp: number;
   ticketId: string;
   type: 'SEATED';
   seatInfo: {
     seats: string[];
   };
 };
}

interface GeneralTicket extends BaseTicket {
 eventType: 'GENERAL';
 ticketType: {
   name: string;
   price: number;
 };
 quantity: number;
 qrMetadata: {
   timestamp: number;
   ticketId: string;
   type: 'GENERAL';
   generalInfo: {
     ticketType: string;
     index: number;
   };
 };
}

type FormattedTicket = SeatedTicket | GeneralTicket;