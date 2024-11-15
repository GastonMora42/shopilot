import brevo from "@getbrevo/brevo";
import QRCode from 'qrcode';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  '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'
);

interface Ticket {
  eventName: string;
  date: string;
  location: string;
  seats: string[];
}
interface SendTicketEmailParams {
  ticket: Ticket;
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Tus entradas para ${ticket.eventName}`;
    sendSmtpEmail.to = [
      { email: email, name: '' },
    ];
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = {
      name: "Shopilot",
      email: "tickets@shopilot.xyz",
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

// Ejemplo de uso
const ticket: Ticket = {
  eventName: "Concierto de Rock",
  date: "2023-05-15",
  location: "Auditorio Nacional",
  seats: ["A1", "A2", "A3"],
};

const qrCode = "https://example.com/qr-code";
const email = "cliente@example.com";

sendTicketEmail({ ticket, qrCode, email });