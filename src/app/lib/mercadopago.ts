// lib/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

interface TicketData {
  _id: string;
  eventName: string;
  price: number;
}

export async function createPreference(ticket: TicketData) {
  const preference = new Preference(mpClient);
  
  const preferenceData = {
    body: {
      items: [
        {
          id: ticket._id,
          title: `Entrada para ${ticket.eventName}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(ticket.price),
        }
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/pending`
      },
      auto_return: "approved" as const,
      external_reference: ticket._id,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`
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