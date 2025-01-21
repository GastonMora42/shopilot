// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configurar el cliente de Brevo
const sendinblue = new SibApiV3Sdk.TransactionalEmailsApi();
sendinblue.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

// lib/email.ts
interface BaseTicketInfo {
  eventName: string;
  date: string;
  location: string;
  qrCode: string;
  qrValidation: string;
  status: string;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
}

interface SeatedTicketInfo extends BaseTicketInfo {
  eventType: 'SEATED';
  seat: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    type: 'SEATED';
    seatInfo: {
      seats: string[];
    };
  };
}

interface GeneralTicketInfo extends BaseTicketInfo {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    type: 'GENERAL';
    generalInfo: {
      ticketType: string;
      index: number;
    };
  };
}

export type TicketInfo = SeatedTicketInfo | GeneralTicketInfo;

export interface SendTicketEmailParams {
  tickets: TicketInfo[];
  email: string;
}


async function generateTicketPDF(tickets: TicketInfo[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  for (const ticket of tickets) {
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Generar QR
    const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Convertir data URL a Uint8Array
    const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrDims = qrImage.scale(0.8);

    // Dibujar contenido
    page.drawText('TICKET DE ENTRADA', {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const textContent = [
      { label: 'Evento:', value: ticket.eventName },
      { 
        label: 'Fecha:', 
        value: new Date(ticket.date).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
      },
      { label: 'Ubicación:', value: ticket.location },
      // Información condicional según el tipo de ticket
      ...(ticket.eventType === 'SEATED' 
        ? [{ label: 'Asiento:', value: ticket.seat }]
        : [{ label: 'Tipo de entrada:', value: ticket.ticketType.name }]
      )
    ];

    let yPosition = height - 100;
    textContent.forEach(({ label, value }) => {
      page.drawText(label, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText(value, {
        x: 150,
        y: yPosition,
        size: 12,
        font: helvetica,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;
    });

    // Dibujar QR
    page.drawImage(qrImage, {
      x: width / 2 - qrDims.width / 2,
      y: yPosition - qrDims.height - 50,
      width: qrDims.width,
      height: qrDims.height,
    });

    // Texto debajo del QR
    page.drawText('Presenta este código QR en la entrada del evento', {
      x: width / 2 - 150,
      y: yPosition - qrDims.height - 80,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function sendTicketEmail({ tickets, email }: SendTicketEmailParams) {
  try {
    console.log('Generando PDF de tickets...');
    
    const pdfBuffer = await generateTicketPDF(tickets);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; text-align: center;">¡Tus entradas están listas!</h1>
        <p style="color: #374151; text-align: center;">
          Encontrarás tus entradas adjuntas en formato PDF.
          Cada entrada tiene su código QR individual que deberás presentar en el evento.
        </p>
        <div style="margin-top: 24px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            ¿Tienes preguntas? Contáctanos en support@showspot.xyz
          </p>
        </div>
      </div>
    `;

    console.log('Preparando envío de email con PDF adjunto');

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = `🎫 Tus entradas para ${tickets[0].eventName}`;
    sendSmtpEmail.htmlContent = emailHtml;
    sendSmtpEmail.sender = { 
      name: 'ShowSpot Tickets', 
      email: 'tickets@showspot.xyz' 
    };
    sendSmtpEmail.to = [{ email }];
    
    // Adjuntar el PDF
    sendSmtpEmail.attachment = [{
      name: 'tickets.pdf',
      content: pdfBuffer.toString('base64')
    }];

    console.log('Enviando email a:', email);
    
    const result = await sendinblue.sendTransacEmail(sendSmtpEmail);
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