// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client';
import QRCode from 'qrcode';

// Configurar el cliente de Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

// Interfaces
interface TicketInfo {
  eventName: string;
  date: string;
  location: string;
  seat: string;
  qrCode: string;
}

interface SendTicketEmailParams {
  tickets: TicketInfo[];
  email: string;
}

interface TicketWithQR extends TicketInfo {
  qrUrl: string;
}

export async function sendTicketEmail({ tickets, email }: SendTicketEmailParams) {
  try {
    console.log('Iniciando generación de email para tickets:', tickets.length);

    // Generar QRs para todos los tickets
    const ticketsWithQr: TicketWithQR[] = await Promise.all(
      tickets.map(async (ticket: TicketInfo) => {
        const qrUrl = await QRCode.toDataURL(ticket.qrCode, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          },
          errorCorrectionLevel: 'H'
        });

        return {
          ...ticket,
          qrUrl
        };
      })
    );

    console.log('QRs generados exitosamente');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tus Entradas</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f7f7f7; padding: 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Encabezado -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                  <span style="color: #059669; font-size: 32px;">✓</span>
                </div>
                <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 8px 0;">¡Compra exitosa!</h1>
                <p style="color: #6b7280; margin: 0;">Total de entradas: ${tickets.length}</p>
              </div>

              <!-- Tickets -->
              ${ticketsWithQr.map((ticket: TicketWithQR, index: number) => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                    Entrada ${index + 1}
                  </h2>
                  <div style="color: #374151; font-size: 14px;">
                    <p style="margin: 8px 0;">
                      <span style="font-weight: 500;">Evento:</span> ${ticket.eventName}
                    </p>
                    <p style="margin: 8px 0;">
                      <span style="font-weight: 500;">Fecha:</span> ${new Date(ticket.date).toLocaleString('es-ES', {
                        dateStyle: 'full',
                        timeStyle: 'short'
                      })}
                    </p>
                    <p style="margin: 8px 0;">
                      <span style="font-weight: 500;">Ubicación:</span> ${ticket.location}
                    </p>
                    <p style="margin: 8px 0;">
                      <span style="font-weight: 500;">Asiento:</span> ${ticket.seat}
                    </p>
                  </div>
                  <div style="text-align: center; margin-top: 16px; background-color: white; padding: 16px; border-radius: 8px;">
                    <img src="${ticket.qrUrl}" 
                         alt="Código QR" 
                         style="width: 200px; height: 200px; display: block; margin: 0 auto;"
                    />
                    <p style="color: #6b7280; font-size: 14px; margin-top: 8px; text-align: center;">
                      Código QR de entrada
                    </p>
                  </div>
                </div>
              `).join('')}

              <!-- Footer -->
              <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  ¿Tienes preguntas? Contáctanos en support@shopilot.xyz
                </p>
              </div>
            </div>

            <!-- Powered by -->
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Powered by Shopilot
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('Preparando envío de email');

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `🎫 Tus entradas para ${tickets[0].eventName}`;
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = { 
      name: 'Shopilot Compra Exitosa', 
      email: 'tickets@shopilot.xyz' 
    };
    sendSmtpEmail.to = [{ email }];

    console.log('Enviando email a:', email);
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email enviado exitosamente:', result);

    return result;

  } catch (error) {
    console.error('Error detallado al enviar email:', {
      error,
      message: error,
      stack: error
    });
    throw error;
  }
}

export type { SendTicketEmailParams, TicketInfo };