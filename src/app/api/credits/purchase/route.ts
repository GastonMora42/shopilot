// app/api/credits/purchase/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CreditPackage } from '@/app/models/Credit';
import { User } from '@/app/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { packageId } = await req.json();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const creditPackage = await CreditPackage.findById(packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Paquete no encontrado' },
        { status: 404 }
      );
    }

    // Usar tu access token de MercadoPago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!
    });
    
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: packageId,
            title: `Paquete de ${creditPackage.credits} créditos`,
            description: `Paquete de ${creditPackage.credits} créditos para publicar eventos`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: creditPackage.price
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/pending`
        },
        auto_return: "approved",
        external_reference: `credits_${user._id}_${packageId}`,
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