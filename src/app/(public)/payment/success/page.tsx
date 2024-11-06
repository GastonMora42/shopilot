// app/(public)/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      const ticketId = searchParams.get('ticketId');
      if (!ticketId) return;

      try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        const data = await response.json();
        setTicket(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [searchParams]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">¡Compra exitosa!</h1>
        <p className="text-gray-600">Tu entrada está lista</p>
      </div>

      {ticket && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex justify-center mb-6">
          <QRCodeSVG value={ticket.qrCode} size={200} />
          </div>
          
          <div className="space-y-4">
            <h2 className="font-semibold">{ticket.eventName}</h2>
            <p>Fecha: {new Date(ticket.eventDate).toLocaleDateString()}</p>
            <p>Asientos: {ticket.seats.join(', ')}</p>
            <p>Total pagado: ${ticket.price}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/tickets">Ver mis entradas</Link>
        </Button>
      </div>
    </div>
  );
}