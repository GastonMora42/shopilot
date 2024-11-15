import brevo from '@getbrevo/brevo';
import QRCode from 'qrcode';

// Configurar la API client de Brevo
const client = new brevo.TransactionalEmailsApi();

client.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY as string
);

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

export async function sendTicketEmail({ ticket, qrCode, email }: SendTicketEmailParams): Promise<void> {
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

    // Configurar los detalles del correo electrónico
    const sendSmtpEmailData = {
      to: [{ email: email }],
      sender: { name: 'Shopilot', email: 'tickets@shopilot.xyz' },
      subject: `Tus entradas para ${ticket.eventName}`,
      htmlContent: emailHtml,
    };

    // Enviar el correo electrónico
    await client.sendTransacEmail(sendSmtpEmailData);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Vuelve a lanzar el error para que el llamador lo capture
  }
}
