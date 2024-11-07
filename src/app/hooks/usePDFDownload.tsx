// hooks/usePDFDownload.ts
'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

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

export function usePDFDownload() {
  const [loading, setLoading] = useState(false);

  const downloadPDF = async (ticket: TicketData) => {
    try {
      setLoading(true);

      // Creamos un documento PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const { width, height } = page.getSize();

      // Añadir texto al PDF
      page.drawText(ticket.eventName, { x: 50, y: height - 50, size: 18 });
      page.drawText(`Fecha: ${new Date(ticket.date).toLocaleString()}`, { x: 50, y: height - 80, size: 12 });
      page.drawText(`Ubicación: ${ticket.location}`, { x: 50, y: height - 110, size: 12 });
      page.drawText(`Asientos: ${ticket.seats.join(', ')}`, { x: 50, y: height - 140, size: 12 });
      page.drawText(`Comprador: ${ticket.buyerInfo.name}`, { x: 50, y: height - 170, size: 12 });

      // Añadir imagen QR
      const qrImageUrl = await fetch(ticket.qrCode).then((res) => res.blob());
      const qrImageBytes = await qrImageUrl.arrayBuffer();
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const qrDims = qrImage.scale(0.5);
      page.drawImage(qrImage, {
        x: width - qrDims.width - 50,
        y: height - qrDims.height - 50,
        width: qrDims.width,
        height: qrDims.height,
      });

      // Crear y descargar el PDF
      const pdfBytes = await pdfDoc.save();
      const url = URL.createObjectURL(new Blob([pdfBytes]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${ticket.eventName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { downloadPDF, loading };
}
