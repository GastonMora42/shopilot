// lib/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN is not defined');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is not defined');
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

interface PreferenceData {
  _id: string;
  eventName: string;
  price: number;
  description?: string;
}

// lib/mercadopago.ts
// lib/mercadopago.ts
export async function createPreference({
  _id,
  eventName,
  price,
  description
}: PreferenceData) {
  try {
    const preference = new Preference(mpClient);
    
    const preferenceData = {
      body: {
        items: [
          {
            id: _id,
            title: `Entrada para ${eventName}`,
            description: description,
            quantity: 1,
            currency_id: "ARS",
            unit_price: Number(price),
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
        },
        auto_return: "approved",
        external_reference: _id,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        statement_descriptor: "SHOPILOT TICKETS",
        // Agregar estas configuraciones
        payment_methods: {
          installments: 1
        },
        expires: true,
        expiration_date_to: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 30 minutos
      }
    };

    console.log('Creating preference with notification URL:', preferenceData.body.notification_url);
    const response = await preference.create(preferenceData);
    console.log('Preference created:', {
      id: response.id,
      init_point: response.init_point,
      notification_url: response.notification_url
    });

    return response;
  } catch (error) {
    console.error('Error creating preference:', error);
    throw error;
  }
}