// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client'
import QRCode from 'qrcode';

// Configurar el cliente de Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
// Corrección en la siguiente línea
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

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


export async function sendTicketEmail({ ticket, qrCode, email }: SendTicketEmailParams) {
  try {
    // Generar imagen QR
    const qrUrl = await QRCode.toDataURL(qrCode);

    // Construir el HTML del correo electrónico
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333;">¡Gracias por tu compra!</h1>
        <p>Aquí están los detalles de tu entrada:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <th style="text-align: left; padding: 10px; background-color: #f2f2f2;">Evento</th>
            <td style="padding: 10px;">${ticket.eventName}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; background-color: #f2f2f2;">Fecha</th>
            <td style="padding: 10px;">${ticket.date}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; background-color: #f2f2f2;">Ubicación</th>
            <td style="padding: 10px;">${ticket.location}</td>
          </tr>
          <tr>
            <th style="text-align: left; padding: 10px; background-color: #f2f2f2;">Asientos</th>
            <td style="padding: 10px;">${ticket.seats.join(', ')}</td>
          </tr>
        </table>
        <img src="${qrUrl}" alt="QR Code" style="max-width: 200px; margin: 20px 0;" />
        <p>¡Disfruta del evento!</p>
      </div>
    `;

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `Tus entradas para ${ticket.eventName}`;
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = { name: 'Shopilot', email: 'tickets@shopilot.xyz' };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}