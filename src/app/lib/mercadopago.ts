// lib/mercadopago.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

interface PreferenceData {
  _id: string;
  eventName: string;
  price: number;
  description?: string;
  organizerAccessToken: string; // Añadido: token del organizador
}

export function createMPClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken: accessToken,
  });
}

export async function createPreference({
  _id,
  eventName,
  price,
  description,
  organizerAccessToken // Token del organizador del evento
}: PreferenceData) {
  try {
    // Crear cliente MP con el token del organizador
    const mpClient = createMPClient(organizerAccessToken);
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

    const response = await preference.create(preferenceData);
    return response;
  } catch (error) {
    console.error('Error creating preference:', error);
    throw error;
  }
}