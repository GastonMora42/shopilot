// app/payment/success/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { usePDFDownload } from '@/app/hooks/usePDFDownload';
import { Loader2Icon } from 'lucide-react';

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

type TicketData = SeatedTicketData | GeneralTicketData;

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { downloadPDF, loading: pdfLoading } = usePDFDownload();

  const verifyPayment = useCallback(async () => {
    try {
      const ticketId = searchParams.get('ticketId') || searchParams.get('external_reference');
      const paymentId = searchParams.get('payment_id');

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
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (!data.success || !data.ticket) {
        throw new Error(data.error || 'Error en la verificación');
      }

      if (!data.ticket.qrTickets || !Array.isArray(data.ticket.qrTickets)) {
        throw new Error('Formato de ticket inválido');
      }

      setTicket(data.ticket);
      return data.ticket.status === 'PAID';

    } catch (error) {
      console.error('Error en verificación:', error);
      setError(error instanceof Error ? error.message : 'Error al procesar el pago');
      return false;
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    if (!searchParams.get('ticketId') && !searchParams.get('external_reference')) {
      setError('Información de pago no encontrada');
      setIsValidating(false);
      return;
    }

    const startVerification = async () => {
      if (!isMounted) return;

      try {
        const isComplete = await verifyPayment();
        
        if (!isMounted) return;

        setVerificationAttempts(prev => prev + 1);

        if (!isComplete && verificationAttempts < 12) {
          const delay = Math.min(1000 * Math.pow(1.5, verificationAttempts), 10000);
          timeoutId = setTimeout(startVerification, delay);
        } else {
          setIsValidating(false);
          if (!ticket && verificationAttempts >= 12) {
            setError('No se pudo confirmar el pago después de varios intentos');
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setIsValidating(false);
        setError(error instanceof Error ? error.message : 'Error inesperado');
      }
    };

    startVerification();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [verificationAttempts, verifyPayment, searchParams, ticket]);

  const handleDownloadPDF = async (qrTicket: QRTicket) => {
    if (!ticket) return;

    try {
      await downloadPDF(ticket, qrTicket.subTicketId);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Validando tu compra</h2>
        <p className="text-gray-600 text-center max-w-md">
          Estamos procesando tu pago. Por favor, espera un momento...
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Intento {verificationAttempts} de 12
        </p>
      </div>
    );
  }

  if (error || (!isValidating && !ticket)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-600 mb-4">
          <svg 
            className="w-16 h-16 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error en el proceso</h1>
        <p className="text-gray-600 mb-8 text-center">{error}</p>
        <div className="space-y-4">
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

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

        <div className="mb-6 border-b pb-4">
          <h2 className="text-lg font-semibold mb-2">Resumen de compra</h2>
          <p className="text-sm text-gray-600">
            Evento: {ticket.eventName}
          </p>
          <p className="text-sm text-gray-600">
            {ticket.eventType === 'SEATED' 
              ? `Asientos: ${ticket.seats.join(', ')}`
              : `${ticket.quantity} entrada(s) - ${ticket.ticketType.name}`
            }
          </p>
          <p className="text-sm text-gray-600">
            Total: ${ticket.price}
          </p>
        </div>

        <div className="space-y-6">
          {ticket.qrTickets?.map((qrTicket, index) => (
            <div key={qrTicket.subTicketId} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4">
                {ticket.eventType === 'SEATED'
                  ? `Asiento: ${qrTicket.seatInfo?.seat || 'No asignado'}`
                  : `Entrada ${index + 1} de ${(ticket as GeneralTicketData).quantity}`
                }
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm">
                  <p>Fecha: {new Date(ticket.date).toLocaleString()}</p>
                  <p>Ubicación: {ticket.location}</p>
                  {ticket.eventType === 'GENERAL' && (
                    <p>Tipo: {(ticket as GeneralTicketData).ticketType.name}</p>
                  )}
                  <p>ID: {qrTicket.subTicketId.slice(-8)}</p>
                </div>

                {qrTicket.status === 'PAID' && qrTicket.qrCode && (
                  <div className="flex flex-col items-center">
                    <QRCodeSVG 
                      value={qrTicket.qrCode}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Código QR de entrada
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleDownloadPDF(qrTicket)}
                disabled={pdfLoading}
                className="w-full mt-4"
              >
                {pdfLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2Icon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Generando PDF...
                  </span>
                ) : (
                  'Descargar PDF'
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/my-tickets">
              Ver todos mis tickets
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}