// lib/mercadopago.ts
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

// Validar que el token existe
if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error('MP_ACCESS_TOKEN is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is not defined in environment variables');
}

// Crear una única instancia del cliente
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

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
  try {
    const preference = new Preference(mpClient);
    
    // Validar los datos requeridos
    if (!_id || !eventName || !price) {
      throw new Error('Missing required preference data');
    }

    // Asegurarse de que el precio es un número válido
    const validPrice = Number(price);
    if (isNaN(validPrice) || validPrice <= 0) {
      throw new Error('Invalid price value');
    }

    const preferenceData = {
      body: {
        items: [
          {
            id: _id,
            title: `Entrada para ${eventName}`,
            description: description || `Entrada para ${eventName}`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: validPrice,
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
        // Agregar metadata útil
        metadata: {
          ticket_id: _id,
          event_name: eventName
        },
        // Configuraciones adicionales recomendadas
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutos
        statement_descriptor: "SHOPILOT TICKETS"
      }
    };

    console.log('Creating preference with data:', preferenceData);

    const response = await preference.create(preferenceData);
    console.log('Preference created:', response);

    return response;
  } catch (error) {
    console.error('Error creating preference:', error);
    // Agregar más contexto al error
    throw new Error(
      `Failed to create MercadoPago preference: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Función útil para verificar pagos
export async function verifyPayment(paymentId: string) {
  try {
    const payment = new Payment(mpClient);
    const paymentInfo = await payment.get({ id: paymentId });
    return paymentInfo;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error(
      `Failed to verify MercadoPago payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}