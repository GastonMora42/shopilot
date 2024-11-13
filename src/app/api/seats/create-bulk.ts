// pages/api/seats/create-bulk.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Seat } from '@/app/models/Seat';
import dbConnect from '@/app/lib/mongodb';
import { isValidObjectId } from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { eventId, seatingChart } = req.body;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ error: 'ID de evento inválido' });
    }

    // Generar asientos con el formato correcto
    const seats = [];
    for (let row = 1; row <= seatingChart.rows; row++) {
      for (let col = 1; col <= seatingChart.columns; col++) {
        const seatId = `${row}-${col}`;
        
        // Encontrar la sección correspondiente
        const section = seatingChart.sections.find((s: { rowStart: number; rowEnd: number; columnStart: number; columnEnd: number; }) => 
          row >= s.rowStart && 
          row <= s.rowEnd && 
          col >= s.columnStart && 
          col <= s.columnEnd
        );

        if (section) {
          seats.push({
            eventId,
            seatId,               // Formato: "1-1"
            row,                  // Número de fila (1-based)
            column: col,          // Número de columna (1-based)
            status: 'AVAILABLE',
            type: section.type,
            price: section.price,
            section: section.name,
            temporaryReservation: null,
            lastReservationAttempt: null
          });
        }
      }
    }

    // Validar que hay asientos para crear
    if (seats.length === 0) {
      return res.status(400).json({ error: 'No hay asientos válidos para crear' });
    }

    // Crear los asientos
    const createdSeats = await Seat.insertMany(seats);
    
    console.log('Created seats:', {
      total: createdSeats.length,
      sample: createdSeats.slice(0, 3).map(seat => ({
        seatId: seat.seatId,
        row: seat.row,
        column: seat.column,
        type: seat.type
      }))
    });

    return res.status(200).json({ 
      success: true, 
      totalSeats: createdSeats.length,
      seats: createdSeats 
    });

  } catch (error) {
    console.error('Error creating seats:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error creating seats' });
  }
}