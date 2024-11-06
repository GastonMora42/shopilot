// src/app/(public)/e/[eventSlug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IEvent } from '@/types';

export default function PublicEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/public/${params.eventSlug}`);
        if (!response.ok) {
          throw new Error('Evento no encontrado');
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error('Error al cargar el evento:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.eventSlug) {
      fetchEvent();
    }
  }, [params.eventSlug]);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!event) {
    return <div className="p-6">Evento no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{event.name}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Detalles del Evento</h2>
            <p className="text-gray-600">{event.description}</p>
          </div>

          <div>
            <h3 className="font-medium">Fecha y Hora</h3>
            <p>{new Date(event.date).toLocaleString()}</p>
          </div>

          <div>
            <h3 className="font-medium">Ubicación</h3>
            <p>{event.location}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2">Entradas</h2>
          {event.seatingChart.sections.map((section, index) => (
            <div 
              key={index}
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{section.name}</h3>
                <span className="text-lg font-bold">
                  ${section.price}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {section.type === 'VIP' && 'Acceso VIP con beneficios especiales'}
                {section.type === 'REGULAR' && 'Entrada General'}
                {section.type === 'DISABLED' && 'Acceso para personas con discapacidad'}
              </p>
              <button 
                className="mt-3 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                onClick={() => {/* Implementar lógica de compra */}}
              >
                Comprar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}