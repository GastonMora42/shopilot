// src/app/api/tickets/bank-transfer/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { Seat } from '@/app/models/Seat';
import { TransferTicket } from '@/app/models/TransferTicket'; 
import { authOptions } from '@/app/lib/auth';
import { generateTicketQRs } from '@/app/lib/qrGenerator';
import mongoose from 'mongoose';
import { uploadToS3 } from '@/app/lib/s3Upload';

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
    console.log('API bank-transfer: Iniciando procesamiento');
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
      try {
        // Convertir base64 a archivo y subir
        const base64Data = reqData.proofImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Subir a tu servicio de almacenamiento
        proofImageUrl = await uploadToS3(buffer, `proof-${Date.now()}.jpg`);
        
        console.log("API bank-transfer: Imagen subida, URL:", proofImageUrl);
        
        if (!proofImageUrl) {
          throw new Error('No se pudo subir el comprobante de pago');
        }
      } catch (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        throw new Error('Error al procesar el comprobante de pago');
      }
    } else {
      throw new Error('El comprobante de pago es obligatorio');
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
    const ticketData = {
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
      paymentMethod: 'BANK_TRANSFER'
    };
    
    console.log("API bank-transfer: Creando ticket principal");
    
    const ticket = new Ticket(ticketData);
    
    // Generar QRs pero con estado PENDING
    const qrTickets = await generateTicketQRs({
      ticketId: ticket._id.toString(),
      eventType: reqData.eventType,
      seats: reqData.seats,
      ticketType: reqData.ticketType,
      quantity: reqData.quantity
    });
    
    ticket.qrTickets = qrTickets;
    
    // Guardar el ticket principal
    const savedTicket = await ticket.save({ session });
    console.log("API bank-transfer: Ticket principal guardado con ID:", savedTicket._id);
    
    // Crear un registro específico para la transferencia
    const transferTicketData = {
      ticketId: savedTicket._id,
      eventId: reqData.eventId,
      buyerInfo: reqData.buyerInfo,
      eventType: reqData.eventType,
      ...(reqData.eventType === 'SEATED' 
        ? { seats: reqData.seats }
        : { 
            ticketType: reqData.ticketType,
            quantity: reqData.quantity
          }
      ),
      price: totalPrice,
      status: 'PENDING',
      transferProof: {
        imageUrl: proofImageUrl,
        notes: reqData.notes || '',
        uploadedAt: new Date()
      }
    };
    
    console.log("API bank-transfer: Creando registro de transferencia");
    
    const transferTicket = new TransferTicket(transferTicketData);
    const savedTransferTicket = await transferTicket.save({ session });
    
    console.log("API bank-transfer: Registro de transferencia guardado con ID:", savedTransferTicket._id);
    
    // Verificar que el registro de transferencia se guardó correctamente
    const verifyTransferTicket = await TransferTicket.findById(savedTransferTicket._id).session(session);
    console.log("API bank-transfer: Verificación de registro de transferencia:", {
      id: verifyTransferTicket._id,
      ticketId: verifyTransferTicket.ticketId,
      status: verifyTransferTicket.status,
      hasTransferProof: !!verifyTransferTicket.transferProof,
      transferProofImageUrl: verifyTransferTicket.transferProof?.imageUrl ? "URL válida" : "URL vacía"
    });
    
    await session.commitTransaction();
    
    return NextResponse.json({
      success: true,
      ticketId: ticket._id,
      transferTicketId: transferTicket._id,
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