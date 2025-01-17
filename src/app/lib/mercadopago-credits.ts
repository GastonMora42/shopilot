// lib/mercadopago-credits.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createMPClient } from './mercadopago';

interface CreditPreferenceData {
  packageId: string;
  credits: number;
  price: number;
  userId: string;
  organizerAccessToken: string;
}

export async function createCreditPreference({
  packageId,
  credits,
  price,
  userId,
  organizerAccessToken
}: CreditPreferenceData) {
  try {
    const mpClient = createMPClient(organizerAccessToken);
    const preference = new Preference(mpClient);
    
    const preferenceData = {
      body: {
        items: [
          {
            id: packageId,
            title: `Paquete de ${credits} créditos`,
            description: `Paquete de ${credits} créditos SHOWSPOT para eventos`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: Number(price),
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/credits/pending`
        },
        auto_return: "approved",
        external_reference: `credits_${userId}_${packageId}`,
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago-credits`,
        statement_descriptor: "SHOWSPOT CREDITS <3"
      }
    };

    const response = await preference.create(preferenceData);
    return response;
  } catch (error) {
    console.error('Error creating credit preference:', error);
    throw error;
  }
}