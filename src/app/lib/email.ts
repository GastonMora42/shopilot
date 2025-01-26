// lib/email.ts
import * as SibApiV3Sdk from '@sendinblue/client';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configurar el cliente de Brevo
const sendinblue = new SibApiV3Sdk.TransactionalEmailsApi();
sendinblue.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

// Interfaces actualizadas para QRs individuales
interface QRTicket {
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
    status: string;
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
}

interface BaseTicketInfo {
  eventName: string;
  date: string;
  location: string;
  status: string;
  buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  };
  qrTickets: QRTicket[];
}

export interface SeatedTicketInfo extends BaseTicketInfo {
  eventType: 'SEATED';
  seats: string[];
  price: number;
}

export interface GeneralTicketInfo extends BaseTicketInfo {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
}

export type TicketInfo = SeatedTicketInfo | GeneralTicketInfo;

export interface SendTicketEmailParams {
  ticket: TicketInfo;
  email: string;
}

async function generateTicketPDF(ticket: TicketInfo): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Generar una página por cada QR individual
  for (const qrTicket of ticket.qrTickets) {
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Generar QR
    const qrDataUrl = await QRCode.toDataURL(qrTicket.qrCode, {
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
      { label: 'Comprador:', value: ticket.buyerInfo.name },
      { label: 'DNI:', value: ticket.buyerInfo.dni },
      // Información específica según tipo de ticket
      ...(ticket.eventType === 'SEATED' 
        ? [{ 
            label: 'Asiento:', 
            value: qrTicket.qrMetadata.seatInfo?.seat || ''
          }]
        : [
            { 
              label: 'Tipo de entrada:', 
              value: qrTicket.qrMetadata.generalInfo?.ticketType || ''
            },
            {
              label: 'Número de entrada:',
              value: `${(qrTicket.qrMetadata.generalInfo?.index || 0) + 1} de ${ticket.quantity}`
            }
          ]
      ),
      { 
        label: 'Precio:', 
        value: `$${ticket.eventType === 'SEATED' 
          ? ticket.price / ticket.seats.length 
          : ticket.ticketType.price
        }`
      }
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

    // Identificador único del QR
    page.drawText(`ID: ${qrTicket.qrMetadata.subTicketId}`, {
      x: width / 2 - 100,
      y: yPosition - qrDims.height - 90,
      size: 10,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Texto debajo del QR
    page.drawText('Presenta este código QR en la entrada del evento', {
      x: width / 2 - 150,
      y: yPosition - qrDims.height - 110,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function sendTicketEmail({ ticket, email }: SendTicketEmailParams) {
  try {
    console.log('Generando PDF de tickets...');
    
    const pdfBuffer = await generateTicketPDF(ticket);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #111827; text-align: center;">¡Tus entradas están listas!</h1>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #374151; margin-bottom: 16px;">Detalles de la compra:</h2>
          <p><strong>Evento:</strong> ${ticket.eventName}</p>
          <p><strong>Fecha:</strong> ${new Date(ticket.date).toLocaleString('es-ES', {
            dateStyle: 'full',
            timeStyle: 'short'
          })}</p>
          <p><strong>Ubicación:</strong> ${ticket.location}</p>
          ${ticket.eventType === 'SEATED' 
            ? `<p><strong>Asientos:</strong> ${ticket.seats.join(', ')}</p>`
            : `<p><strong>Tipo de entrada:</strong> ${ticket.ticketType.name}</p>
               <p><strong>Cantidad:</strong> ${ticket.quantity}</p>`
          }
        </div>
        <p style="color: #374151; text-align: center;">
          Encontrarás tus entradas adjuntas en formato PDF.
          ${ticket.qrTickets.length > 1 
            ? `Se han generado ${ticket.qrTickets.length} códigos QR individuales para tus entradas.` 
            : 'Se ha generado un código QR para tu entrada.'
          }
        </p>
        <p style="color: #374151; text-align: center;">
          Cada código QR es único y válido para una entrada individual.
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
    sendSmtpEmail.subject = `🎫 Tus entradas para ${ticket.eventName}`;
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
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}