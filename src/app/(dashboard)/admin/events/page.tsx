'use client';
import { Card } from '@/components/ui/Card';
import { Calendar, MapPin, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IEvent } from '@/types/event';
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@/components/ui/drop-downmenu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Instagram,
  Link as LinkIcon,
  Check 
} from 'lucide-react';

export default function EventosPage() {
 const [events, setEvents] = useState<IEvent[]>([]);
 const [loading, setLoading] = useState(true);
 const [alert, setAlert] = useState<{type: 'success' | 'error'; message: string} | null>(null);
 const [copiedEvents, setCopiedEvents] = useState<Record<string, boolean>>({});

 const generateSlug = (name: string) => {
  // Mantenemos las mayúsculas y minúsculas, solo reemplazamos espacios y caracteres especiales
  return name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const handleShare = async (event: IEvent) => {
  // Generamos la URL solo con el slug, sin el ID
  const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;

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
  const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;
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
        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Share2 className="h-4 w-4 text-gray-600" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent 
      align="end" 
      sideOffset={5}
      className="w-80 p-3 space-y-2"
    >
      {/* Eliminamos la IIFE y mantenemos el contenido directo */}
      <div className="px-2 pb-2 mb-2 border-b">
        <h3 className="text-sm font-medium">Compartir evento</h3>
        <p className="text-xs text-gray-500 mt-1">
          Comparte este evento con tus amigos y redes sociales
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-blue-50 transition-colors duration-200"
          onClick={() => {
            const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;
            window.open(`https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
          }}
        >
          <Facebook className="h-5 w-5 text-[#1877F2]" />
          <span className="text-xs">Facebook</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-sky-50 transition-colors duration-200"
          onClick={() => {
            const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(eventUrl)}`, '_blank');
          }}
        >
          <Twitter className="h-5 w-5 text-[#1DA1F2]" />
          <span className="text-xs">Twitter</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-green-50 transition-colors duration-200"
          onClick={() => {
            const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(`¡Mira este evento: ${event.name}! ${eventUrl}`)}`, '_blank');
          }}
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          <span className="text-xs">WhatsApp</span>
        </Button>
      </div>

      <div className="relative flex items-center px-3 py-2 bg-gray-50 rounded-lg group">
        <LinkIcon className="h-4 w-4 text-gray-400 absolute left-3" />
        <input
          type="text"
          readOnly
          value={`${window.location.origin}/e/${generateSlug(event.name)}`}
          className="w-full pl-8 pr-20 py-1 text-sm bg-transparent border-none focus:outline-none"
        />
<Button
  variant="ghost"
  size="sm"
  className="absolute right-2 hover:bg-gray-200 text-xs font-medium transition-all duration-200"
  onClick={async () => {
    const eventUrl = `${window.location.origin}/e/${generateSlug(event.name)}`;
    await navigator.clipboard.writeText(eventUrl);
    setCopiedEvents(prev => ({ ...prev, [event._id]: true }));
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => {
      setCopiedEvents(prev => ({ ...prev, [event._id]: false }));
    }, 2000);
  }}
>
  <span className="flex items-center gap-1">
    {copiedEvents[event._id] ? (
      <>
        <Check className="h-4 w-4 text-green-500" />
        <span className="text-green-500">Copiado</span>
      </>
    ) : (
      <>
        <Copy className="h-4 w-4" />
        <span>Copiar</span>
      </>
    )}
  </span>
</Button>
      </div>
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