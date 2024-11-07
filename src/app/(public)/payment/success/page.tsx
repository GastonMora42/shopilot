// app/(public)/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { usePDFDownload } from '@/app/hooks/usePDFDownload';

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

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadPDF, loading: pdfLoading } = usePDFDownload();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketId = searchParams.get('ticketId');
        if (!ticketId) throw new Error('ID de ticket no encontrado');

        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Error al cargar el ticket');

        const data = await response.json();
        setTicket(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button asChild>
          <Link href="/admin/tickets">Ver mis tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Compra exitosa!</h1>
          <p className="text-gray-600">Tu entrada está lista</p>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-4">{ticket.eventName}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Fecha:</span> {new Date(ticket.date).toLocaleString()}</p>
              <p><span className="font-medium">Ubicación:</span> {ticket.location}</p>
              <p><span className="font-medium">Asientos:</span> {ticket.seats.join(', ')}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-4 bg-white border rounded-lg">
              <QRCodeSVG value={ticket.qrCode} size={200} />
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Presenta este código QR en la entrada del evento</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => ticket && downloadPDF(ticket)}
              disabled={pdfLoading}
              className="w-full"
            >
              {pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
            </Button>
            <Button asChild>
              <Link href="/admin/tickets">Ver mis tickets</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/events">Ver más eventos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
