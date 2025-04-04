// app/api/events/cleanup/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';

export async function POST() {
  try {
    await dbConnect();
    
    const now = new Date();
    
    const result = await Event.updateMany(
      {
        endDate: { $lt: now },
        status: { $ne: 'CANCELLED' }
      },
      {
        $set: { status: 'FINISHED' }
      }
    );
    
    return NextResponse.json({
      success: true,
      finishedEvents: result.modifiedCount
    });
  } catch (error) {
    console.error('Error en cleanup de eventos:', error);
    return NextResponse.json(
      { error: 'Error al finalizar eventos' },
      { status: 500 }
    );
  }
}