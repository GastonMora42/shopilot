// app/api/events/public/[slug]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    
    const event = await Event.findOne({ 
      name: params.slug.replace(/-/g, ' '),
      published: true
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar el evento' },
      { status: 500 }
    );
  }
}