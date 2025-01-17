// app/api/credits/balance/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { Credit } from '@/app/models/Credit';
import { User } from '@/app/models/User';
import dbConnect from '@/app/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const credits = await Credit.findOne({ userId: user._id });
    if (!credits) {
      // Si no existe, crear un registro de créditos inicial
      const newCredits = await Credit.create({
        userId: user._id,
        balance: 0,
        transactions: []
      });
      return NextResponse.json({ 
        balance: newCredits.balance,
        transactions: newCredits.transactions
      });
    }

    return NextResponse.json({
      balance: credits.balance,
      transactions: credits.transactions
    });

  } catch (error) {
    console.error('Error al obtener balance:', error);
    return NextResponse.json(
      { error: 'Error al obtener balance' },
      { status: 500 }
    );
  }
}