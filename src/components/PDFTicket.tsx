// components/PDFTicket.tsx
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import crypto from 'crypto';

interface BaseTicketData {
  eventName: string;
  date: string;
  location: string;
  eventType: 'SEATED' | 'GENERAL';
  ticketId: string;
  buyerInfo: {
    name: string;
    email: string;
  };
}

interface SeatedTicketData extends BaseTicketData {
  eventType: 'SEATED';
  seat: string;
}

interface GeneralTicketData extends BaseTicketData {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
}

type TicketData = SeatedTicketData | GeneralTicketData;

export async function generateTicketPDF(ticket: TicketData): Promise<{pdfBytes: Uint8Array, qrValidation: string}> {
  try {
    const validationCode = crypto
      .createHash('sha256')
      .update(`${ticket.ticketId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const qrData = JSON.stringify({
      ticketId: ticket.ticketId,
      validation: validationCode,
      eventType: ticket.eventType,
      ...(ticket.eventType === 'SEATED' 
        ? { seat: ticket.seat }
        : { ticketType: ticket.ticketType.name }),
      timestamp: Date.now()
    });

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256
    });

    if (!qrDataUrl.startsWith('data:image/png;base64,')) {
      throw new Error('Error generating QR code');
    }

    const qrData64 = qrDataUrl.split(',')[1];
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrData64, 'base64'));

    // Dibujar título
    page.drawText('TICKET DE ENTRADA', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Contenido base
    const baseContent = [
      { text: 'Evento:', value: ticket.eventName },
      { text: 'Fecha:', value: new Date(ticket.date).toLocaleString() },
      { text: 'Ubicación:', value: ticket.location },
      { text: 'Comprador:', value: ticket.buyerInfo.name }
    ];

    // Contenido específico según tipo
    const specificContent = ticket.eventType === 'SEATED'
      ? [{ text: 'Asiento:', value: ticket.seat }]
      : [{ text: 'Tipo de entrada:', value: ticket.ticketType.name }];

    const textContent = [...baseContent, ...specificContent];

    let yPosition = height - 100;
    textContent.forEach(({ text, value }) => {
      page.drawText(`${text}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      
      page.drawText(value, {
        x: 150,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      
      yPosition -= 30;
    });

    // Dibujar QR
    const qrSize = 100;
    page.drawImage(qrImage, {
      x: width - qrSize - 50,
      y: height - qrSize - 50,
      width: qrSize,
      height: qrSize
    });

    const pdfBytes = await pdfDoc.save();
      
    return {
      pdfBytes,
      qrValidation: validationCode
    };
  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    throw new Error('Failed to generate ticket PDF');
  }
}