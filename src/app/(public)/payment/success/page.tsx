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
  buyerInfo: {
    name: string;
    email: string;
  };
  status: string;
  price: number;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadPDF, loading: pdfLoading } = usePDFDownload();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const ticketId = searchParams.get('ticketId');
        const paymentId = searchParams.get('payment_id');
        const status = searchParams.get('collection_status');

        console.log('Payment verification params:', { ticketId, paymentId, status });

        if (!ticketId || !paymentId) {
          throw new Error('Parámetros de pago incompletos');
        }

        // Primer intento: Verificar el estado del pago
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            paymentId,
            status
          })
        });

        const data = await response.json();
        console.log('Verification response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Error al verificar el pago');
        }

        // Segundo intento: Obtener los detalles del ticket
        const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
        const ticketData = await ticketResponse.json();

        console.log('Ticket data:', ticketData);

        if (!ticketResponse.ok) {
          throw new Error('Error al obtener los detalles del ticket');
        }

        if (ticketData.ticket.status !== 'PAID') {
          throw new Error('El ticket no está pagado');
        }

        setTicket(ticketData.ticket);
      } catch (error) {
        console.error('Verification error:', error);
        setError(error instanceof Error ? error.message : 'Error al procesar el pago');
      } finally {
        setLoading(false);
      }
    };

    // Intentar verificar inmediatamente
    verifyPayment();

    // Configurar reintentos cada 5 segundos por 1 minuto
    const maxAttempts = 12; // 1 minuto (12 * 5 segundos)
    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (!ticket) {
          setError('No se pudo confirmar el pago después de varios intentos');
        }
        return;
      }
      if (!ticket) {
        await verifyPayment();
        attempts++;
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Verificando el pago...</p>
          <p className="text-sm text-gray-500">Esto puede tomar unos momentos</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error en el proceso</h1>
        <p className="text-gray-600 mb-8">{error || 'No se pudo cargar el ticket'}</p>
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
              <p><span className="font-medium">Precio:</span> ${ticket.price}</p>
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
