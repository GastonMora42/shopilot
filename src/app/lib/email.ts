// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client'
import QRCode from 'qrcode';

// Definir la interfaz
interface SendTicketEmailParams {
  ticket: {
    eventName: string;
    date: string;
    location: string;
    seats: string[];
  };
  qrCode: string;
  email: string;
}

// Configurar el cliente de Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export async function sendTicketEmail({ ticket, qrCode, email }: SendTicketEmailParams) {
  try {
    // Generar QR con fondo blanco y mayor tamaño
    const qrUrl = await QRCode.toDataURL(qrCode, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #f7f7f7; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Encabezado con check verde -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #059669; font-size: 32px;">✓</span>
            </div>
            <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 8px 0;">¡Compra exitosa!</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Tu entrada está lista</p>
          </div>

          <!-- Detalles del ticket -->
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
              ${ticket.eventName}
            </h2>
            <div style="color: #374151; font-size: 14px;">
              <p style="margin: 8px 0;">
                <span style="font-weight: 500;">Fecha:</span> 
                ${new Date(ticket.date).toLocaleString()}
              </p>
              <p style="margin: 8px 0;">
                <span style="font-weight: 500;">Ubicación:</span> 
                ${ticket.location}
              </p>
              <p style="margin: 8px 0;">
                <span style="font-weight: 500;">Asientos:</span> 
                ${ticket.seats.join(', ')}
              </p>
            </div>
          </div>

          <!-- QR Code -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="background-color: white; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; display: inline-block;">
              <img src="${qrUrl}" alt="Código QR" style="width: 200px; height: 200px;" />
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 12px;">
              Presenta este código QR en la entrada del evento
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ¿Tienes preguntas? Contáctanos en support@shopilot.xyz
            </p>
          </div>
        </div>

        <!-- Powered by -->
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px;">
            Powered by Shopilot
          </p>
        </div>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: 'Shopilot Tickets', email: 'tickets@shopilot.xyz' };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = `🎫 Tus entradas para ${ticket.eventName}`;
    sendSmtpEmail.htmlContent = emailHtml;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}