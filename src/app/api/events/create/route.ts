// src/app/api/events/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { User } from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Obtener usuario y sus credenciales de MP
    const user = await User.findOne({ email: session.user.email });
    if (!user.mercadopago?.accessToken) {
      return NextResponse.json(
        { error: 'MercadoPago no está configurado' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const event = await Event.create({
      ...data,
      organizerId: user._id,
      mercadopago: {
        accessToken: user.mercadopago.accessToken,
        userId: user.mercadopago.userId
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Error creating event' },
      { status: 500 }
    );
  }
}