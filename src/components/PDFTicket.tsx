// components/PDFTicket.tsx
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

interface TicketData {
  eventName: string;
  date: string;
  location: string;
  seats: string[];
  qrCode: string;
  buyerInfo: {
    name: string;
    email: string;
  };
}

export async function generateTicketPDF(ticket: TicketData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();

  // Cargar fuente
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Generar QR
  const qrDataUrl = await QRCode.toDataURL(ticket.qrCode);
  const qrData = qrDataUrl.split(',')[1];
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrData, 'base64'));

  // Dibujar contenido
  page.drawText('TICKET DE ENTRADA', {
    x: 50,
    y: height - 50,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  const textContent = [
    { text: 'Evento:', value: ticket.eventName },
    { text: 'Fecha:', value: new Date(ticket.date).toLocaleString() },
    { text: 'Ubicación:', value: ticket.location },
    { text: 'Asientos:', value: ticket.seats.join(', ') },
    { text: 'Comprador:', value: ticket.buyerInfo.name }
  ];

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

  return pdfDoc.save();
}