// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client'
import QRCode from 'qrcode';

// Configurar el cliente de Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export interface TicketInfo {
  eventName: string;
  date: string;
  location: string;
  seat: string;  // Un solo asiento por ticket
  qrCode: string;
}

export interface SendTicketEmailParams {
  tickets: TicketInfo[];
  email: string;
}

export async function sendTicketEmail({ tickets, email }: SendTicketEmailParams) {
  try {
    // Generar QRs para todos los tickets
    const ticketsWithQr = await Promise.all(
      tickets.map(async (ticket) => ({
        ...ticket,
        qrUrl: await QRCode.toDataURL(ticket.qrCode, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        })
      }))
    );

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #f7f7f7; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #059669; font-size: 32px;">✓</span>
            </div>
            <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 8px 0;">¡Compra exitosa!</h1>
            <p class="text-gray-600">Total de entradas: ${tickets.length}</p>
          </div>

          ${ticketsWithQr.map((ticket, index) => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                Entrada ${index + 1} - ${ticket.eventName}
              </h2>
              <div style="color: #374151; font-size: 14px;">
                <p style="margin: 8px 0;"><span style="font-weight: 500;">Fecha:</span> ${new Date(ticket.date).toLocaleString()}</p>
                <p style="margin: 8px 0;"><span style="font-weight: 500;">Ubicación:</span> ${ticket.location}</p>
                <p style="margin: 8px 0;"><span style="font-weight: 500;">Asiento:</span> ${ticket.seat}</p>
              </div>
              <div style="text-align: center; margin-top: 16px;">
                <img src="${ticket.qrUrl}" alt="Código QR" style="width: 200px; height: 200px;" />
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `🎫 Tus entradas para ${tickets[0].eventName}`;
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = { name: 'Shopilot Tickets', email: 'tickets@shopilot.xyz' };
    sendSmtpEmail.to = [{ email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}