// app/(dashboard)/eventos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IEvent } from '@/types';
import Link from 'next/link';

export default function EventosPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleEventStatus = async (eventId: string, published: boolean) => {
    try {
      await fetch(`/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published })
      });
      
      fetchEvents(); // Recargar lista
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Eventos</h1>
        <Link href="/admin/events/nuevo">
          <Button>Crear Evento</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event._id.toString()} className="border rounded-lg p-4">
            <h3 className="font-semibold">{event.name}</h3>
            <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
            <p className="text-sm text-gray-600">{event.location}</p>
            
            <div className="mt-4 flex justify-between items-center">
              <Link href={`/eventos/${event._id}/edit`}>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </Link>
              
              <Button
                variant={event.published ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleEventStatus(event._id.toString(), !event.published)}
              >
                {event.published ? 'Despublicar' : 'Publicar'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}