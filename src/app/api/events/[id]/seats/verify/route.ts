// api/events/[id]/seats/verify/route.ts
import dbConnect from "@/app/lib/mongodb";
import { Seat } from "@/app/models/Seat";
import { NextResponse } from "next/server";
import { isValidObjectId } from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { seatIds, sessionId } = await req.json();

    console.log('Iniciando verificación de asientos:', { 
      eventId: params.id,
      seatIds, 
      sessionId 
    });

    // Validar ID del evento
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ 
        error: 'ID de evento inválido' 
      }, { status: 400 });
    }

    // Validar datos de entrada
    if (!Array.isArray(seatIds) || !sessionId) {
      return NextResponse.json({ 
        error: 'Datos de verificación inválidos' 
      }, { status: 400 });
    }

    // Primero liberar asientos expirados
    await Seat.releaseExpiredSeats(params.id);

    // Verificar disponibilidad actual
    const seats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    }).lean();

    // Verificar que se encontraron todos los asientos solicitados
    if (seats.length !== seatIds.length) {
      console.log('No se encontraron todos los asientos:', {
        requested: seatIds.length,
        found: seats.length
      });
      return NextResponse.json({
        error: 'Algunos asientos no existen',
        requestedSeats: seatIds,
        foundSeats: seats.map(s => s.seatId)
      }, { status: 400 });
    }

    const unavailableSeats = seats.filter(seat => {
      // Si está disponible, no hay problema
      if (seat.status === 'AVAILABLE') return false;
      
      // Si está reservado, verificar si es nuestra sesión y si no ha expirado
      if (seat.status === 'RESERVED') {
        const reservationExpiresAt = seat.temporaryReservation?.expiresAt;
        const isExpired = reservationExpiresAt ? new Date(reservationExpiresAt) < new Date() : true;
        const isSameSession = seat.temporaryReservation?.sessionId === sessionId;
        
        // Si está expirado o es nuestra sesión, está disponible
        return !isExpired && !isSameSession;
      }
      
      // Cualquier otro estado (OCCUPIED) no está disponible
      return true;
    });

    if (unavailableSeats.length > 0) {
      console.log('Asientos no disponibles:', unavailableSeats);
      return NextResponse.json({
        error: 'Algunos asientos no están disponibles',
        unavailableSeats: unavailableSeats.map(seat => ({
          seatId: seat.seatId,
          status: seat.status,
          reservedBy: seat.temporaryReservation?.sessionId === sessionId ? 'you' : 'other',
          expiresAt: seat.temporaryReservation?.expiresAt
        }))
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      available: true,
      availableSeats: seatIds,
      debug: {
        timestamp: new Date(),
        sessionId
      }
    });

  } catch (error) {
    console.error('Error en verificación de asientos:', error);
    return NextResponse.json({ 
      error: 'Error al verificar los asientos',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}