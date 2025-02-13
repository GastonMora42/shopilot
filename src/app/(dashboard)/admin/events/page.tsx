'use client';
import { Card } from '@/components/ui/Card';
import { Calendar, MapPin, Globe, Lock, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IEvent } from '@/types/event';
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@/components/ui/drop-downmenu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

export default function EventosPage() {
 const [events, setEvents] = useState<IEvent[]>([]);
 const [loading, setLoading] = useState(true);
 const [alert, setAlert] = useState<{type: 'success' | 'error'; message: string} | null>(null);


 const handleShare = async (event: IEvent) => {
  // Creamos una URL amigable usando el ID y el nombre del evento
  const eventUrl = `${window.location.origin}/e/${event._id}-${event.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: event.name,
        text: `¡Mira este evento: ${event.name}!`,
        url: eventUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  } else {
    await navigator.clipboard.writeText(eventUrl);
    toast.success('Enlace copiado al portapapeles');
  }
};

const handleCopyLink = async (event: IEvent) => {
  const eventUrl = `${window.location.origin}/e/${event._id}-${event.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;
  await navigator.clipboard.writeText(eventUrl);
  toast.success('Enlace copiado al portapapeles');
};

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
  return <div className="p-8 text-center text-gray-500">Cargando eventos...</div>;
}

return (
  <div className="space-y-8 p-8">
    <div>
      <div className="flex items-center gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Mis Eventos</h1>
        <div className="h-10 w-px bg-gray-200"></div>
        <Link href="/admin/events/nuevo">
          <Button className="bg-[#0087ca] hover:bg-[#0087ca]/90">
            Crear Evento
          </Button>
        </Link>
      </div>
      <p className="text-gray-500 mt-2">
        Gestiona y visualiza todos tus eventos
      </p>
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
      <Card className="text-center py-12">
        <p className="text-gray-500 mb-4">No tienes eventos creados</p>
        <Link href="/admin/events/nuevo">
          <Button className="bg-[#0087ca] hover:bg-[#0087ca]/90">
            Crear tu primer evento
          </Button>
        </Link>
      </Card>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card 
            key={event._id.toString()} 
            className="bg-gradient-to-br from-[#a5dcfd]/20 to-white"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{event.name}</h3>
                <div className="flex items-center gap-2">
                  {event.published ? (
                    <Globe className="h-5 w-5 text-green-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                  
                  {event.published && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(event)}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copiar enlace</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleShare(event)}
                          className="cursor-pointer"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          <span>Compartir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{event.location}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant={event.published ? "destructive" : "default"}
                  size="sm"
                  onClick={() => toggleEventStatus(event._id.toString(), !event.published)}
                  className={event.published ? "" : "bg-[#0087ca] hover:bg-[#0087ca]/90"}
                >
                  {event.published ? 'Despublicar' : 'Publicar'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}
  </div>
);
}