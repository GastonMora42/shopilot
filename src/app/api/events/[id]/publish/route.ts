// app/api/events/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Validar que el evento tenga toda la información necesaria
    if (!event.name || !event.date || !event.location) {
      return NextResponse.json(
        { error: 'El evento no tiene toda la información necesaria' },
        { status: 400 }
      );
    }

    event.published = !event.published;
    event.publishedAt = event.published ? new Date() : null;
    await event.save();

    return NextResponse.json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
      { status: 500 }
    );
  }
}