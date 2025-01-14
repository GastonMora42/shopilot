// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat, ISeat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando obtención de asientos...');
    await dbConnect();

    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ 
        error: 'ID de evento inválido' 
      }, { status: 400 });
    }

    // Primero liberar asientos expirados
    await Seat.releaseExpiredSeats(params.id);

    // Obtener todos los asientos
    const allSeats = await Seat.find({ 
      eventId: params.id 
    }).select('_id seatId row column status type section label temporaryReservation price').lean();

    console.log('Total seats found:', allSeats.length);

    if (!allSeats || allSeats.length === 0) {
      return NextResponse.json({ 
        success: true, 
        seats: [],
        occupiedSeats: [],
        debug: { totalSeats: 0, occupiedCount: 0 }
      });
    }

    // Preparar los asientos con el formato correcto
    const formattedSeats = allSeats.map(seat => ({
      _id: seat._id.toString(),
      seatId: seat.seatId,
      row: seat.row,
      column: seat.column,
      status: seat.status,
      type: seat.type,
      section: seat.section,
      label: seat.label,
      price: seat.price,
      temporaryReservation: seat.temporaryReservation
        ? {
            sessionId: seat.temporaryReservation.sessionId,
            expiresAt: seat.temporaryReservation.expiresAt
          }
        : undefined
    }));

    // Filtrar asientos no disponibles
    const occupiedSeats = allSeats
      .filter(seat => seat.status !== 'AVAILABLE')
      .map(seat => ({
        seatId: seat.seatId,
        status: seat.status,
        type: seat.type,
        section: seat.section,
        temporaryReservation: seat.temporaryReservation
          ? {
              sessionId: seat.temporaryReservation.sessionId,
              expiresAt: seat.temporaryReservation.expiresAt
            }
          : undefined
      }));

    console.log('Response prepared:', {
      totalSeats: formattedSeats.length,
      occupiedSeats: occupiedSeats.length
    });

    return NextResponse.json({ 
      success: true,
      seats: formattedSeats,
      occupiedSeats,
      debug: {
        totalSeats: allSeats.length,
        occupiedCount: occupiedSeats.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting seats:', error);
    return NextResponse.json({
      error: 'Error al obtener los asientos',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando reserva de asientos...');
    await dbConnect();
    
    const { seatIds, sessionId } = await req.json();
    
    // Validaciones básicas
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID de evento inválido' }, { status: 400 });
    }

    if (!Array.isArray(seatIds) || !seatIds.length || !sessionId) {
      return NextResponse.json({ 
        error: 'Datos de reserva inválidos',
        details: { seatIds, sessionId }
      }, { status: 400 });
    }

    // Liberar asientos expirados
    await Seat.releaseExpiredSeats(params.id);

    // Buscar los asientos solicitados
    const seats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    }).lean();

    // Verificar que existan todos los asientos
    if (!seats || seats.length !== seatIds.length) {
      console.log('Asientos no encontrados:', {
        requested: seatIds,
        found: seats?.map(s => s.seatId) || []
      });
      return NextResponse.json({
        error: 'No se encontraron todos los asientos solicitados',
        details: {
          requested: seatIds,
          found: seats?.length || 0
        }
      }, { status: 404 });
    }

    // Verificar disponibilidad real
    const unavailableSeats = seats.filter(seat => {
      // Si está disponible, no hay problema
      if (seat.status === 'AVAILABLE') return false;
      
      // Si está reservado, verificar si es nuestra sesión o si expiró
      if (seat.status === 'RESERVED') {
        const reservationExpiresAt = seat.temporaryReservation?.expiresAt;
        const isExpired = reservationExpiresAt ? new Date(reservationExpiresAt) < new Date() : true;
        const isSameSession = seat.temporaryReservation?.sessionId === sessionId;
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
          type: seat.type,
          section: seat.section,
          temporaryReservation: seat.temporaryReservation
        }))
      }, { status: 409 });
    }

    // Realizar la reserva
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const result = await Seat.updateMany(
      {
        eventId: params.id,
        seatId: { $in: seatIds },
        $or: [
          { status: 'AVAILABLE' },
          {
            status: 'RESERVED',
            'temporaryReservation.sessionId': sessionId
          }
        ]
      },
      {
        $set: {
          status: 'RESERVED',
          temporaryReservation: {
            sessionId,
            expiresAt
          },
          lastReservationAttempt: new Date()
        }
      }
    );

    // Verificar el resultado
    if (result.modifiedCount !== seatIds.length) {
      console.log('Error en reserva:', {
        expected: seatIds.length,
        modified: result.modifiedCount
      });

      // Revertir cambios parciales
      await Seat.updateMany(
        {
          eventId: params.id,
          seatId: { $in: seatIds },
          'temporaryReservation.sessionId': sessionId
        },
        {
          $set: { status: 'AVAILABLE' },
          $unset: { 
            temporaryReservation: 1,
            lastReservationAttempt: 1
          }
        }
      );

      return NextResponse.json({
        error: 'Error en la reserva de asientos',
        details: {
          expected: seatIds.length,
          modified: result.modifiedCount
        }
      }, { status: 409 });
    }

    // Verificar estado final
    const updatedSeats = await Seat.find({
      eventId: params.id,
      seatId: { $in: seatIds }
    }).lean();

    return NextResponse.json({
      success: true,
      reservedCount: result.modifiedCount,
      seats: updatedSeats,
      expiresAt: expiresAt.toISOString(),
      debug: {
        sessionId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en reserva:', error);
    return NextResponse.json({
      error: 'Error al reservar los asientos',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}