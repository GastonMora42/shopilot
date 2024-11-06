// app/(public)/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const ticketId = searchParams.get('ticketId');
        if (!ticketId) return;

        const response = await fetch(`/api/tickets/${ticketId}`);
        const data = await response.json();
        setTicketData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [searchParams]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-600">
          Tu compra se ha procesado correctamente
        </p>
      </div>

      {ticketData && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="font-semibold mb-4">Detalles de la compra:</h2>
          <div className="space-y-2">
            <p><strong>Evento:</strong> {ticketData.eventName}</p>
            <p><strong>Asientos:</strong> {ticketData.seats.join(', ')}</p>
            <p><strong>Total pagado:</strong> ${ticketData.price}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Button asChild className="w-full">
          <Link href="/admin/tickets">
            Ver mis entradas
          </Link>
        </Button>
        
        <Button variant="outline" asChild className="w-full">
          <Link href="/">
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}