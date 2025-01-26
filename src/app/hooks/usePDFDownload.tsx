// hooks/usePDFDownload.tsx
'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

interface QRTicket {
  subTicketId: string;
  qrCode: string;
  qrValidation: string;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface BaseTicketData {
  id: string;
  eventName: string;
  date: string;
  location: string;
  eventType: 'SEATED' | 'GENERAL';
  status: string;
  qrTickets: QRTicket[];
  buyerInfo: {
    name: string;
    email: string;
  };
  price: number;
  paymentId: string;
}

interface SeatedTicketData extends BaseTicketData {
  eventType: 'SEATED';
  seats: string[];
}

interface GeneralTicketData extends BaseTicketData {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
}

export function usePDFDownload() {
  const [loading, setLoading] = useState(false);

  const downloadPDF = async (ticket: SeatedTicketData | GeneralTicketData, subTicketId: string) => {
    try {
      setLoading(true);

      // Encontrar el QR específico
      const qrTicket = ticket.qrTickets.find(qr => qr.subTicketId === subTicketId);
      if (!qrTicket) {
        throw new Error('QR no encontrado');
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();

      // Cargar fuentes
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Generar QR
      const qrDataUrl = await QRCode.toDataURL(qrTicket.qrCode, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Convertir data URL a Uint8Array
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrDims = qrImage.scale(0.8);

      // Dibujar título
      page.drawText('TICKET DE ENTRADA', {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      // Preparar contenido basado en el tipo de ticket
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
        // Información específica según tipo de ticket
        ...(ticket.eventType === 'SEATED'
          ? [{ 
              label: 'Asiento:', 
              value: qrTicket.seatInfo?.seat || 'N/A'
            }]
          : [
              { 
                label: 'Tipo de entrada:', 
                value: ticket.ticketType.name
              },
              {
                label: 'Número de entrada:',
                value: `${(qrTicket.generalInfo?.index || 0) + 1} de ${ticket.quantity}`
              }
            ]
        ),
        { 
          label: 'Precio:', 
          value: `$${ticket.eventType === 'SEATED' 
            ? (ticket.price / ticket.seats.length).toFixed(2)
            : ticket.ticketType.price.toFixed(2)}`
        },
        { label: 'ID:', value: qrTicket.subTicketId.slice(-8) }
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

        page.drawText(String(value), {
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

      // Generar nombre de archivo
      const fileName = ticket.eventType === 'SEATED'
        ? `ticket-${ticket.eventName.toLowerCase().replace(/\s+/g, '-')}-${qrTicket.seatInfo?.seat}.pdf`
        : `ticket-${ticket.eventName.toLowerCase().replace(/\s+/g, '-')}-${(qrTicket.generalInfo?.index || 0) + 1}.pdf`;

      // Generar y descargar el PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { downloadPDF, loading };
}