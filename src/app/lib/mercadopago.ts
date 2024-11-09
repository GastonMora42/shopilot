// lib/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

// lib/mercadopago.tssgiss
interface PreferenceData {
  _id: string;
  eventName: string;
  price: number;
  description?: string;
}

export async function createPreference({
  _id,
  eventName,
  price,
  description
}: PreferenceData) {
  const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN ?? '',
  });

  const preference = new Preference(mpClient);
  
  const preferenceData = {
    body: {
      items: [
        {
          id: _id,
          title: `Entrada para ${eventName}`,
          description: description || `Entrada para ${eventName}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(price),
        }
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?ticketId=${_id}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure?ticketId=${_id}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending?ticketId=${_id}`
      },
      auto_return: "approved",
      external_reference: _id,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
    }
  };

  try {
    const response = await preference.create(preferenceData);
    return response;
  } catch (error) {
    console.error('Error creating preference:', error);
    throw error;
  }
}