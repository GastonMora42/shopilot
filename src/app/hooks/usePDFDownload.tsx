// hooks/usePDFDownload.tsx
'use client';

import { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

interface TicketData {
  id: string;
  eventName: string;
  date: string;
  location: string;
  eventType: 'SEATED' | 'GENERAL';
  seat?: string;
  ticketType?: {
    name: string;
    price: number;
  };
  qrCode: string;
  status: string;
  buyerInfo: {
    name: string;
    email: string;
  };
  price: number;
  paymentId: string;
}

export function usePDFDownload() {
  const [loading, setLoading] = useState(false);

  const downloadPDF = async (ticket: TicketData) => {
    try {
      setLoading(true);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page.getSize();

      // Cargar fuentes
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Generar QR
      const qrDataUrl = await QRCode.toDataURL(ticket.qrCode || '', {
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
        { label: 'Evento:', value: ticket.eventName || 'N/A' },
        { 
          label: 'Fecha:', 
          value: ticket.date ? new Date(ticket.date).toLocaleString('es-ES', {
            dateStyle: 'full',
            timeStyle: 'short'
          }) : 'N/A'
        },
        { label: 'Ubicación:', value: ticket.location || 'N/A' },
        // Información condicional según el tipo de ticket
        ...(ticket.eventType === 'SEATED' 
          ? [{ label: 'Asiento:', value: ticket.seat || 'N/A' }]
          : [{ label: 'Tipo de entrada:', value: ticket.ticketType?.name || 'N/A' }]
        ),
        { label: 'Comprador:', value: ticket.buyerInfo?.name || 'N/A' },
        { label: 'Total:', value: `$${ticket.price || 0}` },
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

      // Generar nombre de archivo según tipo de ticket
      const fileName = ticket.eventType === 'SEATED'
        ? `ticket-${ticket.eventName?.toLowerCase().replace(/\s+/g, '-')}-${ticket.seat}.pdf`
        : `ticket-${ticket.eventName?.toLowerCase().replace(/\s+/g, '-')}-${ticket.ticketType?.name?.toLowerCase()}.pdf`;

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