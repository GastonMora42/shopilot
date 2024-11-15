// lib/email.ts
import { SES } from 'aws-sdk';
import QRCode from 'qrcode';

const ses = new SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

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

    const params = {
      Source: 'Shopilot <tickets@shopilot.xyz>',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `Tus entradas para ${ticket.eventName}`,
        },
        Body: {
          Html: {
            Data: emailHtml,
          },
        },
      },
    };

    await ses.sendEmail(params).promise();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}