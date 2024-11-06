// app/(public)/e/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { IEvent } from '@/types';

export default function PublicEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
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
            // Aquí podrías agregar un formulario para estos datos
            name: 'Comprador Prueba',
            email: 'comprador@test.com',
            dni: '12345678'
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      // Redirigir a MercadoPago
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      setError('Error al procesar la compra');
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!event) return <div className="p-6">Evento no encontrado</div>;

  const totalPrice = selectedSeats.reduce((total, seat) => {
    const [sectionName] = seat.split('-');
    const section = event.seatingChart.sections.find(s => s.name === sectionName);
    return total + (section?.price || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          <p className="text-gray-600 mb-4">{event.description}</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Fecha y Hora</h3>
              <p>{new Date(event.date).toLocaleDateString('es-AR', {
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
              <div className="space-y-2">
                {event.seatingChart.sections.map((section) => (
                  <div key={section.name} className="flex justify-between">
                    <span>{section.name}</span>
                    <Badge variant={section.type === 'VIP' ? 'secondary' : 'default'}>
                      ${section.price}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Seleccionar Asientos</h2>
            {/* Aquí va tu componente de selección de asientos */}
            {/* Por ahora usaremos botones de ejemplo */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className={selectedSeats.includes(`A${i + 1}`) ? 'bg-primary text-white' : ''}
                  onClick={() => {
                    if (selectedSeats.includes(`A${i + 1}`)) {
                      setSelectedSeats(seats => seats.filter(s => s !== `A${i + 1}`));
                    } else {
                      setSelectedSeats(seats => [...seats, `A${i + 1}`]);
                    }
                  }}
                >
                  A{i + 1}
                </Button>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Resumen</h3>
            <div className="space-y-2">
              <p>Asientos seleccionados: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold">Total: ${totalPrice}</p>
              <Button
                className="w-full mt-4"
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