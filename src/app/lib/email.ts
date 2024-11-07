// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail(ticket: any, pdfBuffer: Buffer) {
  try {
    await resend.emails.send({
      from: 'tickets@shopilot.xyz',
      to: ticket.buyerInfo.email,
      subject: `Tus entradas para ${ticket.eventName}`,
      html: `
        <h1>¡Gracias por tu compra!</h1>
        <p>Adjuntamos tus entradas para ${ticket.eventName}</p>
      `,
      attachments: [
        {
          filename: `ticket-${ticket.eventName}.pdf`,
          content: pdfBuffer
        }
      ]
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
}