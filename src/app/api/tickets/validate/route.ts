// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import mongoose from 'mongoose';
import { validateQR, type QRData } from '@/app/lib/qrGenerator';

export async function POST(req: Request) {
 let session: mongoose.ClientSession | null = null;

 try {
   await dbConnect();
   const { qrString } = await req.json();
   
   if (!qrString) {
     return NextResponse.json({
       success: false,
       message: 'Código QR requerido'
     }, { status: 400 });
   }

   const qrValidation = validateQR(qrString);
   if (!qrValidation.isValid || !qrValidation.data) {
     return NextResponse.json({
       success: false,
       message: qrValidation.error || 'QR inválido'
     }, { status: 400 });
   }

   const qrData = qrValidation.data;
   session = await mongoose.startSession();
   await session.startTransaction();

   // Obtener ticket usando aggregate
   const [ticketData] = await Ticket.aggregate([
     {
       $match: {
         _id: new mongoose.Types.ObjectId(qrData.ticketId)
       }
     },
     {
       $lookup: {
         from: 'events',
         localField: 'eventId',
         foreignField: '_id',
         as: 'eventData'
       }
     },
     {
       $unwind: '$eventData'
     },
     {
       $project: {
         _id: 1,
         eventId: 1,
         eventType: 1,
         status: 1,
         qrCodes: 1,
         buyerInfo: 1,
         seats: 1,
         ticketType: 1,
         updatedAt: 1,
         eventData: {
           name: 1,
           date: 1,
           location: 1
         }
       }
     }
   ]).session(session);

   if (!ticketData) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Ticket no encontrado'
     }, { status: 404 });
   }

   // Validar que tenemos qrCodes
   if (!ticketData.qrCodes || !Array.isArray(ticketData.qrCodes) || ticketData.qrCodes.length === 0) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Ticket sin códigos QR'
     }, { status: 400 });
   }

   // Validar fecha del evento
   const eventDate = new Date(ticketData.eventData.date);
   const now = new Date();
   
   if (eventDate < now) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'El evento ya ha finalizado'
     }, { status: 400 });
   }

   // Encontrar el QR específico
   const qrIndex = ticketData.qrCodes.findIndex((qr: { qrValidation: string; }) => 
     qr.qrValidation === qrData.validationHash
   );

   if (qrIndex === -1) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'QR inválido o manipulado'
     }, { status: 400 });
   }

   // Verificar si este QR específico ya fue usado
   if (ticketData.qrCodes[qrIndex].used) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Este QR ya fue utilizado',
       ticket: {
         eventName: ticketData.eventData.name,
         buyerName: ticketData.buyerInfo.name,
         status: 'USED',
         qrIndex,
         totalQRs: ticketData.qrCodes.length,
         validatedAt: ticketData.updatedAt
       }
     }, { status: 400 });
   }

   if (ticketData.status !== 'PAID') {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: `Ticket no válido - Estado: ${ticketData.status}`,
       ticket: {
         eventName: ticketData.eventData.name,
         buyerName: ticketData.buyerInfo.name,
         status: ticketData.status
       }
     }, { status: 400 });
   }

   // Actualizar el ticket
   const updatedTicket = await Ticket.findOneAndUpdate(
     {
       _id: ticketData._id,
       'qrCodes._id': ticketData.qrCodes[qrIndex]._id
     },
     {
       $set: {
         'qrCodes.$.used': true
       }
     },
     { new: true, session }
   );

   if (!updatedTicket) {
     await session.abortTransaction();
     return NextResponse.json({
       success: false,
       message: 'Error al actualizar ticket'
     }, { status: 500 });
   }

   // Verificar si todos los QRs están usados
   const allQRsUsed = updatedTicket.qrCodes.every((qr: { used: any; }) => qr.used);
   if (allQRsUsed) {
     updatedTicket.status = 'USED';
     await updatedTicket.save({ session });
   }

   // Si es ticket con asiento, actualizar el asiento
   if (updatedTicket.eventType === 'SEATED') {
     const seat = updatedTicket.seats[qrIndex];
     await Seat.findOneAndUpdate(
       {
         eventId: updatedTicket.eventId,
         seatId: seat,
         status: 'OCCUPIED'
       },
       {
         $set: { status: 'USED' }
       },
       { session }
     );
   }

   await session.commitTransaction();

   return NextResponse.json({
     success: true,
     message: '¡ACCESO PERMITIDO!',
     ticket: {
       eventName: ticketData.eventData.name,
       buyerName: ticketData.buyerInfo.name,
       eventType: ticketData.eventType,
       status: allQRsUsed ? 'USED' : 'PAID',
       dni: ticketData.buyerInfo.dni,
       qrIndex,
       totalQRs: ticketData.qrCodes.length,
       allQRsUsed,
       ...(ticketData.eventType === 'SEATED' 
         ? { 
             seat: ticketData.seats[qrIndex]
           }
         : { 
             ticketType: ticketData.ticketType?.name
           }),
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