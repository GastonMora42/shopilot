// src/app/api/tickets/bank-transfer/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { authOptions } from '@/app/lib/auth';
import { generateTicketQRs } from '@/app/lib/qrGenerator';
import mongoose from 'mongoose';
import { uploadToS3 } from '@/app/lib/s3Upload'; // Necesitarás esta utilidad

interface TransferTicketRequest {
  eventId: string;
  eventType: 'SEATED' | 'GENERAL';
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  proofImage: string; // Base64
  notes?: string;
  sessionId?: string;
}

export async function POST(req: Request) {
  let session = null;
  
  try {
    const reqData = await req.json() as TransferTicketRequest;
    const userSession = await getServerSession(authOptions);
    
    await dbConnect();
    session = await mongoose.startSession();
    session.startTransaction();
    
    // Validar datos básicos
    if (!reqData.eventId || !reqData.buyerInfo) {
      throw new Error('Datos incompletos');
    }
    
    // Obtener el evento
    const event = await Event.findById(reqData.eventId).session(session);
    if (!event) {
      throw new Error('Evento no encontrado');
    }
    
    // Verificar método de pago
    if (event.paymentMethod !== 'BANK_TRANSFER') {
      throw new Error('Este evento no acepta pagos por transferencia');
    }
    
    // Procesar y guardar la imagen
    let proofImageUrl = '';
    if (reqData.proofImage) {
      // Convertir base64 a File y subir
      const base64Data = reqData.proofImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Subir a S3 o tu servicio de almacenamiento
      proofImageUrl = await uploadToS3(buffer, `proof-${Date.now()}.jpg`);
    }
    
    // Calcular precio total
    let totalPrice = 0;
    
    if (reqData.eventType === 'SEATED') {
      if (!reqData.seats || !reqData.seats.length) {
        throw new Error('No se seleccionaron asientos');
      }
      
      // Validar asientos y calcular precio
      const seats = await Seat.find({
        eventId: reqData.eventId,
        seatId: { $in: reqData.seats }
      }).session(session);
      
      totalPrice = seats.reduce((sum, seat) => sum + seat.price, 0);
      
      // Reservar asientos
      await Seat.updateMany(
        { eventId: reqData.eventId, seatId: { $in: reqData.seats } },
        { 
          $set: { 
            status: 'RESERVED',
            temporaryReservation: {
              sessionId: reqData.sessionId,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
            }
          }
        },
        { session }
      );
    } else {
      // Evento general
      if (!reqData.ticketType || !reqData.quantity) {
        throw new Error('Datos de entradas incompletos');
      }
      
      totalPrice = reqData.ticketType.price * reqData.quantity;
    }
    
    // Crear ticket con estado PENDING
    const ticket = new Ticket({
      eventId: reqData.eventId,
      userId: userSession?.user?.id || null,
      eventType: reqData.eventType,
      ...(reqData.eventType === 'SEATED' 
        ? { seats: reqData.seats }
        : { 
            ticketType: reqData.ticketType,
            quantity: reqData.quantity
          }
      ),
      buyerInfo: reqData.buyerInfo,
      status: 'PENDING',
      price: totalPrice,
      transferProof: {
        imageUrl: proofImageUrl,
        notes: reqData.notes || '',
        uploadedAt: new Date()
      }
    });
    
    // Generar QRs pero con estado PENDING
    const qrTickets = await generateTicketQRs({
      ticketId: ticket._id.toString(),
      eventType: reqData.eventType,
      seats: reqData.seats,
      ticketType: reqData.ticketType,
      quantity: reqData.quantity
    });
    
    ticket.qrTickets = qrTickets;
    await ticket.save({ session });
    
    await session.commitTransaction();
    
    return NextResponse.json({
      success: true,
      ticketId: ticket._id,
      message: 'Ticket creado correctamente, pendiente de aprobación'
    });
    
  } catch (error) {
    if (session) await session.abortTransaction();
    console.error('Error al procesar pago por transferencia:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el pago'
      },
      { status: 400 }
    );
  } finally {
    if (session) await session.endSession();
  }
}