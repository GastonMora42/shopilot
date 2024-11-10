// lib/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN no está definido');
}

export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

interface PreferenceData {
  ticketId: string;
  eventName: string;
  price: number;
  seats: string[];
}

export async function createPreference(data: PreferenceData) {
  const preference = new Preference(mercadopago);
  
  return preference.create({
    body: {
      items: [
        {
          id: data.ticketId,
          title: `Entrada para ${data.eventName}`,
          description: `Asientos: ${data.seats.join(', ')}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: data.price
        }
      ],
      metadata: {
        ticketId: data.ticketId,
        seats: data.seats
      },
      external_reference: data.ticketId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
    }
  });
}