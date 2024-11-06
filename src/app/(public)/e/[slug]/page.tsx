// app/(public)/e/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { IEvent } from '@/types';
import { SeatSelector } from '@/components/events/SeatSelector';

export default function PublicEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/public/${params.slug}`);
      if (!response.ok) throw new Error('Evento no encontrado');
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!event) return 0;
    
    return selectedSeats.reduce((total, seatId) => {
      const [row] = seatId.split('');
      const rowIndex = row.charCodeAt(0) - 65;
      
      const section = event.seatingChart.sections.find(section =>
        rowIndex >= section.rowStart &&
        rowIndex <= section.rowEnd
      );
      
      return total + (section?.price || 0);
    }, 0);
  };

  const handlePurchase = async () => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event?._id,
          seats: selectedSeats,
          buyerInfo: {
            name: 'Test Buyer',
            email: 'test@example.com',
            dni: '12345678'
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar la compra');
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!event) return <div className="p-6 text-center">Evento no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          <p className="text-gray-600 mb-6">{event.description}</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Fecha y Hora</h3>
              <p>{new Date(event.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <div>
              <h3 className="font-medium">Ubicación</h3>
              <p>{event.location}</p>
            </div>

            <div>
              <h3 className="font-medium">Precios</h3>
              <div className="space-y-2 mt-2">
                {event.seatingChart.sections.map((section) => (
                  <div 
                    key={section.name}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <span>{section.name}</span>
                    <span className="font-semibold">${section.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <SeatSelector
              seatingChart={event.seatingChart}
              selectedSeats={selectedSeats}
              onSeatSelect={setSelectedSeats}
            />
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Resumen de compra</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Asientos seleccionados:</span>
                <span>{selectedSeats.join(', ') || 'Ninguno'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={selectedSeats.length === 0}
                onClick={handlePurchase}
              >
                Comprar Entradas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}