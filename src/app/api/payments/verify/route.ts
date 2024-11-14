// app/api/payments/verify/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';

export async function POST(req: Request) {
 let session: mongoose.ClientSession | null = null;

 try {
   const { ticketId, paymentId } = await req.json();
   
   console.log('Iniciando verificación de pago:', { ticketId, paymentId });

   if (!ticketId || !paymentId) {
     return NextResponse.json(
       { error: 'Datos incompletos' },
       { status: 400 }
     );
   }

   await dbConnect();
   session = await mongoose.startSession();
   session.startTransaction();

   // Buscar y actualizar el ticket
   const ticket = await Ticket.findByIdAndUpdate(
     ticketId,
     {
       status: 'PAID',
       paymentId
     },
     { 
       new: true, 
       populate: 'eventId',
       session 
     }
   );

   if (!ticket) {
     await session.abortTransaction();
     console.log('Ticket no encontrado:', ticketId);
     return NextResponse.json(
       { error: 'Ticket no encontrado' },
       { status: 404 }
     );
   }

   console.log('Ticket actualizado:', {
     id: ticket._id,
     status: ticket.status,
     seats: ticket.seats
   });

   // Actualizar los asientos a OCCUPIED
   const seatResult = await Seat.updateMany(
     {
       eventId: ticket.eventId,
       seatId: { $in: ticket.seats },
       status: 'RESERVED'
     },
     {
       $set: { 
         status: 'OCCUPIED',
         ticketId: ticket._id
       },
       $unset: {
         temporaryReservation: 1,
         lastReservationAttempt: 1
       }
     },
     { session }
   );

   console.log('Resultado actualización de asientos:', {
     modifiedCount: seatResult.modifiedCount,
     expectedCount: ticket.seats.length
   });

   if (seatResult.modifiedCount !== ticket.seats.length) {
     await session.abortTransaction();
     console.error('Error en actualización de asientos:', {
       expected: ticket.seats.length,
       updated: seatResult.modifiedCount
     });
     return NextResponse.json({
       error: 'Error al actualizar el estado de los asientos'
     }, { status: 500 });
   }

   await session.commitTransaction();
   console.log('Transacción completada exitosamente');

   return NextResponse.json({
     success: true,
     ticket: {
       id: ticket._id,
       status: ticket.status,
       eventName: ticket.eventId.name,
       date: ticket.eventId.date,
       location: ticket.eventId.location,
       seats: ticket.seats,
       qrCode: ticket.qrCode,
       buyerInfo: ticket.buyerInfo,
       price: ticket.price,
       paymentId: ticket.paymentId
     }
   });

 } catch (error) {
   if (session) {
     await session.abortTransaction();
   }
   console.error('Error en verificación:', error);
   return NextResponse.json({
     success: false,
     error: 'Error al verificar el pago'
   }, { status: 500 });
 } finally {
   if (session) {
     await session.endSession();
   }
 }
}