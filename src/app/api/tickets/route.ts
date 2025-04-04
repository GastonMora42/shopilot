import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { Ticket } from '@/app/models/Ticket';
import { Seat } from '@/app/models/Seat';
import { User } from '@/app/models/User';
import { createPreference } from '@/app/lib/mercadopago';
import { isValidObjectId } from 'mongoose';
import mongoose from 'mongoose';
import { authOptions } from '@/app/lib/auth';
import { getServerSession } from 'next-auth/next';
import { generateTicketQRs } from '@/app/lib/qrGenerator';

export async function POST(req: Request) {
  let session = null;
  
  try {
    // Verificar autenticación
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para comprar tickets' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { eventId, eventType, seats, ticketType, quantity, buyerInfo, sessionId, paymentMethod } = await req.json();
    
    console.log('Creating ticket request:', { 
      eventId, eventType, seats, ticketType, quantity, buyerInfo, sessionId, paymentMethod
    });

    if (!isValidObjectId(eventId) || !buyerInfo) {
      return NextResponse.json(
        { error: 'Datos incompletos o inválidos' },
        { status: 400 }
      );
    }

    // Validación por tipo de evento
    if (eventType === 'SEATED' && (!seats?.length)) {
      return NextResponse.json(
        { error: 'Asientos requeridos para evento con asientos' },
        { status: 400 }
      );
    }
    
    // Validación específica para tickets generales
    if (eventType === 'GENERAL') {
      if (!ticketType?.name || !ticketType?.price || !quantity) {
        return NextResponse.json(
          { error: 'Datos de ticket general incompletos' },
          { status: 400 }
        );
      }
    }
    
    const event = await Event.findById(eventId);
    if (!event || !event.published) {
      return NextResponse.json(
        { error: 'Evento no encontrado o no publicado' },
        { status: 404 }
      );
    }
    
    // Verificar que el método de pago coincide con el configurado para el evento
    if (paymentMethod && paymentMethod !== event.paymentMethod) {
      return NextResponse.json(
        { error: `Este evento requiere pago por ${event.paymentMethod === 'MERCADOPAGO' ? 'MercadoPago' : 'transferencia bancaria'}` },
        { status: 400 }
      );
    }

    // Si el método de pago es transferencia, redirigir a la ruta específica
    if (event.paymentMethod === 'BANK_TRANSFER') {
      return NextResponse.json(
        { error: 'Este evento requiere pago por transferencia bancaria. Use el endpoint /api/tickets/bank-transfer' },
        { status: 400 }
      );
    }
    
    // Validaciones adicionales para eventos generales
    if (eventType === 'GENERAL') {
      // Verificar que el tipo de ticket exista en el evento
      const validTicket = event.generalTickets.find((t: { name: any; price: any; }) => 
        t.name === ticketType.name && t.price === ticketType.price
      );
    
      if (!validTicket) {
        return NextResponse.json(
          { error: 'Tipo de ticket inválido' },
          { status: 400 }
        );
      }
    
      // Verificar disponibilidades
      if (validTicket.quantity < quantity) {
        return NextResponse.json(
          { error: 'No hay suficientes tickets disponibles' },
          { status: 400 }
        );
      }
    
      // Verificar límite de compra si existe
      if (event.maxTicketsPerPurchase && quantity > event.maxTicketsPerPurchase) {
        return NextResponse.json(
          { error: `No puede comprar más de ${event.maxTicketsPerPurchase} tickets por transacción` },
          { status: 400 }
        );
      }
    }
    
    // Verificar que el organizador tenga configurado MercadoPago
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

    if (eventType === 'SEATED') {
      // Cálculo de precio para eventos con asientos
      for (const seatId of seats) {
        try {
          if (!/^[A-Z]\d+$/.test(seatId)) {
            throw new Error(`Formato de asiento inválido: ${seatId}`);
          }

          const rowLetter = seatId.match(/[A-Z]/)?.[0];
          if (!rowLetter) {
            throw new Error(`Formato de fila inválido en el asiento: ${seatId}`);
          }

          const rowNumber = rowLetter.charCodeAt(0) - 65;

          // Verificar que exista el seatingChart
          if (!event.seatingChart?.sections) {
            throw new Error('Configuración de secciones no encontrada');
          }

          // Ordenar secciones por rango de filas
          const orderedSections = event.seatingChart.sections.sort((a: { rowStart: number; }, b: { rowStart: number; }) => a.rowStart - b.rowStart);

          // Buscar la sección correcta
          const section = orderedSections.find((s: { rowStart: number; rowEnd: number; name: any; }) => {
            const isInSection = rowNumber >= s.rowStart && rowNumber <= s.rowEnd;
            console.log(`Verificando sección ${s.name}:`, {
              rowNumber,
              rowLetter,
              sectionStart: s.rowStart,
              sectionEnd: s.rowEnd,
              sectionStartLetter: String.fromCharCode(s.rowStart + 65),
              sectionEndLetter: String.fromCharCode(s.rowEnd + 65),
              isInSection
            });
            return isInSection;
          });

          if (!section) {
            // Crear un mapa visual de las secciones disponibles
            const sectionMap = orderedSections.map((s: { name: any; rowStart: number; rowEnd: number; }) => ({
              name: s.name,
              rows: {
                start: String.fromCharCode(s.rowStart + 65),
                end: String.fromCharCode(s.rowEnd + 65)
              },
              range: `${String.fromCharCode(s.rowStart + 65)}-${String.fromCharCode(s.rowEnd + 65)}`
            }));

            const gaps = findSectionGaps(orderedSections);
            
            throw new Error(
              `El asiento ${seatId} (Fila ${rowLetter}) no pertenece a ninguna sección configurada.\n` +
              `Secciones disponibles:\n${sectionMap.map((s: { name: any; range: any; }) => 
                `- ${s.name}: Filas ${s.range}`
              ).join('\n')}\n` +
              (gaps.length > 0 ? 
                `Hay espacios sin asignar entre las filas: ${gaps.map(g => 
                  `${String.fromCharCode(g.start + 65)}-${String.fromCharCode(g.end + 65)}`
                ).join(', ')}` : '')
            );
          }

          total += section.price;
        } catch (error) {
          console.error(`Error procesando asiento ${seatId}:`, error);
          throw error;
        }
      }
    } else {
      total = ticketType.price * quantity;
    }

    if (eventType === 'SEATED') {
      // Verificar disponibilidad de asientos
      const seatsStatus = await Seat.find({
        eventId,
        seatId: { $in: seats },
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            'temporaryReservation.sessionId': sessionId,
            'temporaryReservation.expiresAt': { $gt: new Date() }
          }
        ]
      }).session(session);

      if (seatsStatus.length !== seats.length) {
        const unavailableSeats = seats.filter(
          (seatId: string) => !seatsStatus.some(s => s.seatId === seatId)
        );
        throw new Error(`Asientos no disponibles: ${unavailableSeats.join(', ')}`);
      }
    }

    const qrTickets = await generateTicketQRs({
      ticketId: new mongoose.Types.ObjectId().toString(),
      eventType,
      seats,
      ticketType,
      quantity
    });
    
    // Crear ticket con los QRs individuales
    const ticketData = {
      eventId,
      eventType,
      qrTickets,
      status: 'PENDING',
      buyerInfo: {
        ...buyerInfo,
        email: buyerInfo.email.toLowerCase().trim()
      },
      price: total,
      organizerId: event.organizerId,
      userId: authSession.user.id,
      paymentMethod: 'MERCADOPAGO', // Establecer explícitamente el método de pago
      ...(eventType === 'SEATED' 
        ? { seats } 
        : { 
            ticketType, 
            quantity 
          })
    };
    
    const [newTicket] = await Ticket.create([ticketData], { session });

    // Crear preferencia de pago en MercadoPago
    const preference = await createPreference({
      _id: newTicket._id.toString(),
      eventName: event.name,
      price: newTicket.price,
      description: eventType === 'SEATED' 
        ? `${seats.length} entrada(s) para ${event.name}`
        : `${quantity} entrada(s) para ${event.name}`,
      organizerAccessToken: organizer.mercadopago.accessToken
    });

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      ticket: {
        id: newTicket._id,
        eventType,
        seats: newTicket.seats,
        ticketType: newTicket.ticketType,
        quantity: newTicket.quantity,
        total: newTicket.price,
        qrTickets: newTicket.qrTickets.map((qr: { qrMetadata: { subTicketId: any; status: any; seatInfo: any; generalInfo: any; }; qrCode: any; qrValidation: any; }) => ({
          subTicketId: qr.qrMetadata.subTicketId,
          qrCode: qr.qrCode,
          qrValidation: qr.qrValidation,
          status: qr.qrMetadata.status,
          ...(eventType === 'SEATED'
            ? { seatInfo: qr.qrMetadata.seatInfo }
            : { generalInfo: qr.qrMetadata.generalInfo }
          )
        }))
      },
      checkoutUrl: preference.init_point,
      preferenceId: preference.id
    });

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

// Función auxiliar para encontrar espacios entre secciones
function findSectionGaps(sections: Array<{ rowStart: number; rowEnd: number }>) {
  const gaps = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const currentEnd = sections[i].rowEnd;
    const nextStart = sections[i + 1].rowStart;
    if (nextStart - currentEnd > 1) {
      gaps.push({
        start: currentEnd + 1,
        end: nextStart - 1
      });
    }
  }
  return gaps;
}