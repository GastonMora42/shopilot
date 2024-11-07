// hooks/usePDFDownload.ts
'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { TicketPDF } from '@/components/TicketPDF';

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
      const element = <TicketPDF ticket={ticket} />;
      const instance = pdf(element);
      const blob = await instance.toBlob();
      
      const url = URL.createObjectURL(blob);
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