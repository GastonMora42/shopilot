// app/api/tickets/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { User } from '@/app/models/User';
import { createPreference } from '@/app/lib/mercadopago';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { generateTicketQR } from '@/app/lib/qrGenerator';
import mongoose from 'mongoose';

export async function POST(req: Request) {
 let session = null;

 try {
   const authSession = await getServerSession(authOptions);
   await dbConnect();
   
   const { eventId, seats, buyerInfo, eventType, ticketType, quantity } = await req.json();

   // Validaciones según tipo de evento
   if (eventType === 'SEATED' && (!eventId || !seats?.length || !buyerInfo)) {
     return NextResponse.json(
       { error: 'Datos incompletos para ticket con asientos' },
       { status: 400 }
     );
   }

   if (eventType === 'GENERAL' && (!eventId || !ticketType || !quantity || !buyerInfo)) {
     return NextResponse.json(
       { error: 'Datos incompletos para ticket general' },
       { status: 400 }
     );
   }

   // Verificar evento y disponibilidad
   const event = await Event.findById(eventId).populate('organizerId');
   if (!event || !event.published) {
     return NextResponse.json(
       { error: 'Evento no encontrado o no publicado' },
       { status: 404 }
     );
   }

   // Verificar que el organizador tenga MP conectado
   const organizer = await User.findById(event.organizerId);
   if (!organizer?.mercadopago?.accessToken) {
     return NextResponse.json(
       { error: 'El organizador no tiene una cuenta de MercadoPago conectada' },
       { status: 400 }
     );
   }

   session = await mongoose.startSession();
   session.startTransaction();

   let total = 0;
   let ticketData;

   if (eventType === 'SEATED') {
     // Verificar disponibilidad de asientos
     const existingTickets = await Ticket.find({
       eventId,
       'seats': { $in: seats },
       status: { $in: ['PAID', 'PENDING'] }
     }).session(session);

     if (existingTickets.length > 0) {
       await session.abortTransaction();
       return NextResponse.json(
         { error: 'Algunos asientos ya no están disponibles' },
         { status: 400 }
       );
     }

     // Calcular precio total para asientos
     total = seats.reduce((sum: number, seat: string) => {
       const [sectionName] = seat.split('-');
       const section = event.seatingChart.sections.find((s: { name: string; }) => s.name === sectionName);
       return sum + (section?.price || 0);
     }, 0);

     // Generar QR para tickets con asientos
     const { qrData, qrString, validationHash } = generateTicketQR({
       ticketId: new mongoose.Types.ObjectId().toString(),
       eventType: 'SEATED',
       seats
     });

     ticketData = {
       eventId,
       eventType: 'SEATED',
       seats,
       qrCode: qrString,
       qrValidation: validationHash,
       qrMetadata: {
         timestamp: qrData.timestamp,
         ticketId: qrData.ticketId,
         type: 'SEATED',
         seatInfo: {
           seats: seats
         }
       }
     };
   } else {
     // Verificar disponibilidad de tickets generales
     if (!event.generalTickets || !event.generalTickets.length) {
       await session.abortTransaction();
       return NextResponse.json(
         { error: 'Este evento no tiene entradas generales' },
         { status: 400 }
       );
     }

     const selectedTicketType = event.generalTickets.find((t: { name: any; }) => t.name === ticketType.name);
     if (!selectedTicketType || selectedTicketType.quantity < quantity) {
       await session.abortTransaction();
       return NextResponse.json(
         { error: 'No hay suficientes entradas disponibles' },
         { status: 400 }
       );
     }

     total = ticketType.price * quantity;

     // Generar QR para tickets generales
     const { qrData, qrString, validationHash } = generateTicketQR({
       ticketId: new mongoose.Types.ObjectId().toString(),
       eventType: 'GENERAL',
       ticketType,
       quantity
     });

     ticketData = {
       eventId,
       eventType: 'GENERAL',
       ticketType,
       quantity,
       qrCode: qrString,
       qrValidation: validationHash,
       qrMetadata: {
         timestamp: qrData.timestamp,
         ticketId: qrData.ticketId,
         type: 'GENERAL',
         generalInfo: {
           ticketType: ticketType.name,
           index: 0
         }
       }
     };
   }

   // Crear ticket
   const ticket = await Ticket.create([{
     ...ticketData,
     status: 'PENDING',
     price: total,
     buyerInfo: {
       ...buyerInfo,
       email: authSession?.user?.email?.toLowerCase() || buyerInfo.email.toLowerCase()
     },
     organizerId: event.organizerId,
     userId: authSession?.user?.id
   }], { session });

   // Crear preferencia de MP
   const preference = await createPreference({
     _id: ticket[0]._id.toString(),
     eventName: event.name,
     price: total,
     description: eventType === 'SEATED' 
       ? `${seats.length} entrada(s) para ${event.name}`
       : `${quantity} entrada(s) para ${event.name}`,
     organizerAccessToken: organizer.mercadopago.accessToken
   });

   // Actualizar ticket con ID de preferencia
   await Ticket.findByIdAndUpdate(
     ticket[0]._id,
     { paymentId: preference.id },
     { session }
   );

   await session.commitTransaction();

   return NextResponse.json({
     success: true,
     ticket: ticket[0],
     preferenceId: preference.id,
     checkoutUrl: preference.init_point
   }, { status: 201 });

 } catch (error) {
   if (session) {
     await session.abortTransaction();
   }
   console.error('Error creating ticket:', error);
   return NextResponse.json(
     { error: error instanceof Error ? error.message : 'Error al procesar la compra' },
     { status: 500 }
   );
 } finally {
   if (session) {
     await session.endSession();
   }
 }
}