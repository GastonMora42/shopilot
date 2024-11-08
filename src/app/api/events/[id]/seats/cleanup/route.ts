// app/api/seats/cleanup/route.ts
// app/api/events/[id]/seats/route.ts
import dbConnect from '@/app/lib/mongodb';
import { Seat } from '@/app/models/Seat';
import { NextResponse } from 'next/server';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
    try {
      await dbConnect();
  
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
      // Liberar asientos de tickets pendientes expirados
      const expiredTickets = await Ticket.find({
        status: 'PENDING',
        createdAt: { $lt: fifteenMinutesAgo }
      });
  
      if (expiredTickets.length > 0) {
        const updateResult = await Seat.updateMany(
          {
            ticketId: { $in: expiredTickets.map(t => t._id) },
            status: 'RESERVED'
          },
          {
            status: 'AVAILABLE',
            $unset: { ticketId: "" }
          }
        );
  
        await Ticket.updateMany(
          { _id: { $in: expiredTickets.map(t => t._id) } },
          { status: 'CANCELLED' }
        );
  
        console.log('Cleanup results:', {
          expiredTickets: expiredTickets.length,
          updatedSeats: updateResult.modifiedCount
        });
      }
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error in cleanup:', error);
      return NextResponse.json({ error: 'Error in cleanup' }, { status: 500 });
    }
  }