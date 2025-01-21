// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { Event } from '@/app/models/Event'; 
import mongoose from 'mongoose';

export async function POST(req: Request) {
 let session: mongoose.ClientSession | null = null;
 
 try {
   await dbConnect();
   const { qrCode } = await req.json();
   
   if (!qrCode) {
     return NextResponse.json({
       success: false,
       message: 'Código QR requerido'
     }, { status: 400 });
   }

   session = await mongoose.startSession();
   await session.startTransaction();

   const ticket = await Ticket.findOne({ qrCode })
     .populate('eventId')
     .session(session);

   if (!ticket) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Ticket no encontrado'
     }, { status: 404 });
   }

   // Validar fecha del evento
   const eventDate = new Date(ticket.eventId.date);
   const now = new Date();
   
   if (eventDate < now) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'El evento ya ha finalizado'
     }, { status: 400 });
   }

   // Validar estado del ticket
   if (ticket.status === 'USED') {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Ticket ya utilizado',
       ticket: {
         eventName: ticket.eventId.name,
         buyerName: ticket.buyerInfo.name,
         status: ticket.status,
         usedAt: ticket.updatedAt
       }
     }, { status: 400 });
   }

   if (ticket.status !== 'PAID') {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: `Ticket no válido - Estado: ${ticket.status}`,
       ticket: {
         eventName: ticket.eventId.name,
         buyerName: ticket.buyerInfo.name,
         status: ticket.status
       }
     }, { status: 400 });
   }

   // Verificar validación del QR
   if (!ticket.qrValidation || ticket.qrValidation !== ticket.qrMetadata?.validation) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'QR inválido o manipulado'
     }, { status: 400 });
   }

   // Actualizar ticket
   ticket.status = 'USED';
   await ticket.save({ session });

   // Manejar según el tipo de ticket
   if (ticket.eventType === 'SEATED') {
     const seatResult = await Seat.updateMany(
       {
         eventId: ticket.eventId._id,
         seatId: { $in: ticket.seats },
         status: 'OCCUPIED',
         ticketId: ticket._id
       },
       {
         $set: { 
           status: 'USED'
         }
       },
       { session }
     );

     if (seatResult.modifiedCount !== ticket.seats.length) {
       await session.abortTransaction();
       return NextResponse.json({
         success: false,
         message: 'Error al validar asientos'
       }, { status: 500 });
     }
   }

   await session.commitTransaction();

   return NextResponse.json({ 
     success: true,
     message: 'Acceso permitido',
     ticket: {
       eventName: ticket.eventId.name,
       buyerName: ticket.buyerInfo.name,
       eventType: ticket.eventType,
       ...(ticket.eventType === 'SEATED' 
         ? { 
             seats: ticket.seats.join(', '),
             seatInfo: ticket.qrMetadata.seatInfo
           }
         : { 
             ticketType: ticket.ticketType.name,
             quantity: ticket.quantity,
             generalInfo: ticket.qrMetadata.generalInfo
           }),
       status: ticket.status,
       validatedAt: new Date()
     }
   });

 } catch (error) {
   if (session) await session.abortTransaction();
   console.error('Error validating ticket:', error);
   return NextResponse.json({
     success: false,
     message: error instanceof Error ? error.message : 'Error al validar ticket'
   }, { status: 500 });
 } finally {
   if (session) await session.endSession();
 }
}