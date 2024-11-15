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
  paymentId: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { downloadPDF, loading: pdfLoading } = usePDFDownload();

  const verifyPayment = async () => {
    try {
      const ticketId = searchParams.get('ticketId') || searchParams.get('external_reference');
      const paymentId = searchParams.get('payment_id');

      console.log('Intento de verificación:', {
        intento: verificationAttempts + 1,
        ticketId,
        paymentId
      });

      if (!ticketId || !paymentId) {
        throw new Error('Información de pago incompleta');
      }

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          paymentId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error en la verificación del pago');
      }

      const data = await response.json();
      setTicket(data.ticket);
      
      // Si el ticket está pagado, detener las verificaciones
      if (data.ticket.status === 'PAID') {
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('Error en verificación:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el pago');
      return false;
    } finally {
      setVerificationAttempts(prev => prev + 1);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const startVerification = async () => {
      setLoading(true);
      const isComplete = await verifyPayment();
      
      if (!isComplete && verificationAttempts < 12) { // 1 minuto (12 intentos * 5 segundos)
        timeoutId = setTimeout(startVerification, 5000);
      } else {
        setLoading(false);
        if (!ticket && verificationAttempts >= 12) {
          setError('No se pudo confirmar el pago después de varios intentos');
        }
      }
    };

    startVerification();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams]); // Solo depende de searchParams

  if (loading && verificationAttempts < 12) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Verificando el pago...</p>
          <p className="text-sm text-gray-500">Intento {verificationAttempts} de 12</p>
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
  <p><span className="font-medium">Pago ID:</span> {ticket.paymentId}</p>
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
            <Button variant="outline" asChild>
              <Link href="/events">Ver más eventos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}