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
  seat: string; // Cambiado de seats a seat
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
  const [tickets, setTickets] = useState<TicketData[]>([]); // Cambiado de ticket a tickets
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
      setTickets(data.tickets); // Ahora guardamos el array de tickets
      
      // Si todos los tickets están pagados, detener las verificaciones
      if (data.tickets.every((ticket: TicketData) => ticket.status === 'PAID')) {
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
        if (!tickets && verificationAttempts >= 12) {
          setError('No se pudo confirmar el pago después de varios intentos');
        }
      }
    };

    startVerification();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams]); // Solo depende de searchParams

  if (error || tickets.length === 0) {
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

  // Calcular el total de la compra
  const totalPurchase = tickets.reduce((sum, ticket) => sum + ticket.price, 0);


return (
  <div className="min-h-screen bg-gray-50 py-12 px-4">
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">¡Compra exitosa!</h1>
        <p className="text-gray-600">Tus entradas están listas</p>
      </div>

      {/* Resumen de compra */}
      <div className="mb-6 border-b pb-4">
        <h2 className="text-lg font-semibold mb-2">Resumen de compra</h2>
        <p className="text-sm text-gray-600">
          Evento: {tickets[0].eventName}
        </p>
        <p className="text-sm text-gray-600">
          Total de entradas: {tickets.length} | Monto total: ${tickets.reduce((sum, t) => sum + t.price, 0)}
        </p>
      </div>

      {/* Lista de tickets */}
      <div className="space-y-6">
        {tickets.map((ticket, index) => (
          <div key={ticket.id} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">
              Entrada {index + 1}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Fecha:</span> {new Date(ticket.date).toLocaleString()}</p>
                <p><span className="font-medium">Ubicación:</span> {ticket.location}</p>
                <p><span className="font-medium">Asiento:</span> {ticket.seat}</p>
                <p><span className="font-medium">Precio:</span> ${ticket.price}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white border rounded-lg">
                  <QRCodeSVG value={ticket.qrCode} size={150} />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Código QR de entrada
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => downloadPDF(ticket)}
                disabled={pdfLoading}
                className="w-full"
              >
                {pdfLoading ? 'Generando PDF...' : `Descargar PDF - Entrada ${index + 1}`}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
}