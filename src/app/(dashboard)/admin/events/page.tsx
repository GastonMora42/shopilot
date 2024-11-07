// app/(dashboard)/admin/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { IEvent } from '@/types';
import Link from 'next/link';

export default function EventosPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Error al cargar eventos');
      }
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        type: 'error',
        message: 'Error al cargar los eventos'
      });
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
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el evento');
      }

      setAlert({
        type: 'success',
        message: published ? 'Evento publicado exitosamente' : 'Evento despublicado'
      });
      
      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al actualizar el evento'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Eventos</h1>
        <Link href="/admin/events/nuevo">
          <Button>Crear Evento</Button>
        </Link>
      </div>

      {alert && (
        <Alert 
          variant={alert.type}
          className="mb-4"
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes eventos creados</p>
          <Link href="/admin/events/nuevo">
            <Button>Crear tu primer evento</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event._id.toString()} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{event.name}</h3>
                <Badge variant={event.published ? "success" : "secondary"}>
                  {event.published ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
              <p className="text-sm text-gray-600">{event.location}</p>
              
              <div className="mt-4 space-x-2 flex justify-end">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
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
      )}
    </div>
  );
}