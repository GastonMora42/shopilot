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
            description: description || `Entrada para ${eventName}`,
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
        statement_descriptor: "SHOWSPOT TICKETS"
      }
    };

    console.log('Creating preference:', preferenceData);
    const response = await preference.create(preferenceData);
    console.log('Preference created:', response);

    return response;
  } catch (error) {
    console.error('Error creating preference:', error);
    throw error;
  }
}