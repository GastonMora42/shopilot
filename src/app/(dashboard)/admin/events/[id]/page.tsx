// src/app/(dashboard)/admin/events/[id]/page.tsxss
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IEvent } from '@/types';

export default function EventPage() {
  const params = useParams();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!event) {
    return <div>Evento no encontrado</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{event.name}</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Detalles del Evento</h2>
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
          <h2 className="text-lg font-semibold">Configuración de Asientos</h2>
          <div>
            <p><strong>Filas:</strong> {event.seatingChart.rows}</p>
            <p><strong>Columnas:</strong> {event.seatingChart.columns}</p>
          </div>

          <div>
            <h3 className="font-medium">Secciones</h3>
            {event.seatingChart.sections.map((section, index) => (
              <div key={index} className="mt-2 p-3 bg-gray-50 rounded">
                <p><strong>{section.name}</strong></p>
                <p>Tipo: {section.type}</p>
                <p>Precio: ${section.price}</p>
                <p>Filas: {section.rowStart + 1} - {section.rowEnd + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}