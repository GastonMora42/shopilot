// lib/email.ts
import { Resend } from 'resend';
import { TicketEmail } from '@/components/email/TicketEmail';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { data, error } = await resend.emails.send({
      from: 'Shopilot <tickets@shopilot.xyz>',
      to: email,
      subject: `Tus entradas para ${ticket.eventName}`,
      react: TicketEmail({ ticket, qrUrl }),
    });

    if (error) {
      console.error('Error Resend:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}