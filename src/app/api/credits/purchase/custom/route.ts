// app/api/credits/purchase/custom/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { User } from '@/app/models/User';

const CREDIT_PRICE = 149.50;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { credits } = await req.json();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const totalPrice = Number((credits * CREDIT_PRICE).toFixed(2));

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!
    });
    
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
              title: `${credits} Créditos`,
              description: `Compra de ${credits} créditos SHOWSPOT`,
              quantity: 1,
              currency_id: "ARS",
              unit_price: totalPrice,
              id: 'credits'
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/pending`
        },
        auto_return: "approved",
        external_reference: `credits_${user._id}_custom_${credits}`,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago-credits`
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating preference:', error);
    return NextResponse.json(
      { error: 'Error al procesar la compra' },
      { status: 500 }
    );
  }
}