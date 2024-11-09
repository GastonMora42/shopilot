// app/(public)/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { usePDFDownload } from '@/app/hooks/usePDFDownload';

interface TicketData {
  id: string;
  eventName: string;
  date: string;
  location: string;
  seats: string[];
  qrCode: string;
  status: string;
  buyerInfo: {
    name: string;
    email: string;
  };
  price: number;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadPDF, loading: pdfLoading } = usePDFDownload();

  useEffect(() => {
// En PaymentSuccessPage, actualiza la función verifyPayment:
const verifyPayment = async () => {
  try {
    const ticketId = searchParams.get('ticketId');
    const paymentId = searchParams.get('payment_id');

    if (!ticketId || !paymentId) {
      throw new Error('Parámetros incompletos');
    }

    // Primero verificar el estado actual
    const statusResponse = await fetch(`/api/tickets/${ticketId}/status`);
    const statusData = await statusResponse.json();

    if (statusData.status === 'PAID') {
      // Si ya está pagado, obtener los detalles completos
      const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
      const ticketData = await ticketResponse.json();
      setTicket(ticketData.ticket);
      return;
    }

    // Si no está pagado, verificar con MercadoPago
    const verifyResponse = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, paymentId })
    });

    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok) {
      throw new Error(verifyData.error || 'Error al verificar el pago');
    }

    if (verifyData.success) {
      setTicket(verifyData.ticket);
    }
  } catch (error) {
    console.error('Verification error:', error);
    setError(error instanceof Error ? error.message : 'Error al verificar el pago');
  } finally {
    setLoading(false);
  }
};

    // Verificar inmediatamente
    verifyPayment();

    // Reintentar cada 5 segundos por 1 minuto si el ticket está pendiente
    const maxAttempts = 12;
    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts >= maxAttempts || ticket?.status === 'PAID') {
        clearInterval(interval);
        if (!ticket && attempts >= maxAttempts) {
          setError('No se pudo confirmar el pago después de varios intentos');
        }
        return;
      }
      attempts++;
      await verifyPayment();
    }, 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Procesando el pago...</p>
          <p className="text-sm text-gray-500">Esto puede tomar unos momentos</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error en el proceso</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/tickets">Ver mis tickets</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
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
              <p><span className="font-medium">Total:</span> ${ticket.price}</p>
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
              onClick={() => downloadPDF(ticket)}
              disabled={pdfLoading}
              className="w-full"
            >
              {pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
            </Button>
            <Button asChild>
              <Link href="/tickets">Ver mis tickets</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/events">Ver más eventos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}