// pages/events/[slug]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Share2, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Seat } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Toast } from '@/components/ui/Toast';
import { PurchaseSummary } from '@/components/ui/PurchaseSummary';
import { AdaptiveHeader } from '@/components/ui/AdaptativeHeader';
import { TicketSelector } from '@/components/tickets/TicketSelector';
import { GeneralEvent, SelectedGeneralTicket } from '@/types/event';
import { IEvent, IGeneralEvent, ISeatedEvent } from '@/types/index';

interface UIState {
  loading: boolean;
  error: string | null;
  showBuyerForm: boolean;
  isProcessing: boolean;
  showNotification: boolean;
  notificationMessage: string;
  activeTab: string;
}

interface ControlState {
  sessionId: string;
  reservationTimeout: number | null;
  pollingInterval: NodeJS.Timeout | null;
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  
  // Estados principales
  const [event, setEvent] = useState<IEvent | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<SelectedGeneralTicket[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<Array<{
    seatId: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    temporaryReservation?: {
      sessionId: string;
      expiresAt: Date;
    };
  }>>([]);

  // Estado UI
  const [uiState, setUiState] = useState<UIState>({
    loading: true,
    error: null,
    showBuyerForm: false,
    isProcessing: false,
    showNotification: false,
    notificationMessage: '',
    activeTab: 'description'
  });

  // Estado de control
  const [controlState, setControlState] = useState<ControlState>({
    sessionId: crypto.randomUUID(),
    reservationTimeout: null,
    pollingInterval: null
  });

  // Agrega estas funciones type guard al inicio del archivo
function isSeatedEvent(event: IEvent): event is ISeatedEvent {
  return event.eventType === 'SEATED';
}

function isGeneralEvent(event: IEvent): event is IGeneralEvent {
  return event.eventType === 'GENERAL';
}

  // Función para mostrar notificaciones
  const showToast = useCallback((message: string) => {
    setUiState(prev => ({
      ...prev,
      showNotification: true,
      notificationMessage: message
    }));
    setTimeout(() => {
      setUiState(prev => ({
        ...prev,
        showNotification: false
      }));
    }, 5000);
  }, []);

  // Fetch inicial del evento
// En tu PublicEventPage
const fetchEvent = useCallback(async () => {
  try {
    setUiState(prev => ({ ...prev, loading: true }));
    const response = await fetch(`/api/events/public/${params.slug}`);
    if (!response.ok) throw new Error('Evento no encontrado');
    const data = await response.json();
    setEvent(data);

    // Aquí es donde debes modificar el código
    if (data.eventType === 'SEATED') {
      const seatsResponse = await fetch(`/api/events/${data._id}/seats`);
      const seatsData = await seatsResponse.json();
      if (seatsResponse.ok) {
        setSeats(seatsData.seats || []);
        setOccupiedSeats(seatsData.occupiedSeats || []);
        console.log('Seats loaded:', {
          total: seatsData.seats?.length,
          occupied: seatsData.occupiedSeats?.length
        });
      }
    }
  } catch (error) {
    setUiState(prev => ({
      ...prev,
      error: 'Error al cargar el evento'
    }));
  } finally {
    setUiState(prev => ({ ...prev, loading: false }));
  }
}, [params.slug]);

  // Fetch de asientos ocupados
  const fetchOccupiedSeats = useCallback(async () => {
    if (!event?._id || event.eventType !== 'SEATED') return;
  
    try {
      const response = await fetch(`/api/events/${event._id}/seats`);
      if (!response.ok) throw new Error('Error al obtener asientos');
      
      const data = await response.json();
      setOccupiedSeats(data.occupiedSeats || []);

      // Actualizar selección si algún asiento ya no está disponible
      setSelectedSeats(prev => 
        prev.filter(seat => {
          const occupiedSeat = data.occupiedSeats.find((os: any) => os.seatId === seat.seatId);
          if (!occupiedSeat) return true;
          if (occupiedSeat.status === 'AVAILABLE') return true;
          if (occupiedSeat.status === 'RESERVED' && 
              occupiedSeat.temporaryReservation?.sessionId === controlState.sessionId) {
            return true;
          }
          return false;
        })
      );
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      showToast('Error al actualizar el estado de los asientos');
    }
  }, [event?._id, event?.eventType, controlState.sessionId, showToast]);

  // Manejo de selección de asientos
  const handleSeatSelect = useCallback((seat: Seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s._id === seat._id);
      return isSelected ? prev.filter(s => s._id !== seat._id) : [...prev, seat];
    });
  }, []);

  // Manejo de selección de tickets generales
  const handleTicketSelect = useCallback((ticketId: string, quantity: number) => {
    setSelectedTickets(prev => {
      const updated = prev.filter(t => t.ticketId !== ticketId);
      
      if (quantity > 0 && event?.eventType === 'GENERAL') {
        const ticket = event.generalTickets.find(t => t.id === ticketId);
        if (ticket) {
          updated.push({ ticketId, quantity, price: ticket.price });
        }
      }
      
      return updated;
    });
  }, [event]);

  // Manejo de inicio de compra
  const handleStartPurchase = useCallback(async () => {
    try {
      if (!event?._id) return;

      if (event.eventType === 'SEATED') {
        // Reservar asientos
        const reserveResponse = await fetch(`/api/events/${event._id}/seats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            seatIds: selectedSeats.map(s => s.seatId),
            sessionId: controlState.sessionId 
          })
        });

        if (!reserveResponse.ok) {
          const data = await reserveResponse.json();
          if (data.unavailableSeats) {
            showToast('Algunos asientos ya no están disponibles');
            await fetchOccupiedSeats();
            return;
          }
          throw new Error(data.error || 'Error al reservar asientos');
        }

        const reserveData = await reserveResponse.json();
        if (reserveData.expiresAt) {
          setControlState(prev => ({
            ...prev,
            reservationTimeout: new Date(reserveData.expiresAt).getTime()
          }));
        }
      }

      setUiState(prev => ({ ...prev, showBuyerForm: true }));
    } catch (error) {
      console.error('Error starting purchase:', error);
      showToast('Error al iniciar la compra. Por favor, intenta de nuevo.');
    }
  }, [event?._id, event?.eventType, selectedSeats, controlState.sessionId, fetchOccupiedSeats, showToast]);

  // Manejo de compra
  const handlePurchase = useCallback(async (buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  }) => {
    setUiState(prev => ({ ...prev, isProcessing: true }));
    try {
      if (!event?._id) throw new Error('Evento no válido');

      const purchaseData = event.eventType === 'SEATED' 
        ? {
            eventId: event._id,
            seats: selectedSeats.map(s => s.seatId),
            buyerInfo,
            sessionId: controlState.sessionId
          }
        : {
            eventId: event._id,
            tickets: selectedTickets,
            buyerInfo
          };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar la compra');
      }

      const { checkoutUrl } = await response.json();
      
      if (checkoutUrl) {
        // Guardar información de compra
        localStorage.setItem('lastPurchaseAttempt', JSON.stringify({
          eventId: event._id,
          selectedSeats: event.eventType === 'SEATED' ? selectedSeats.map(s => s.seatId) : undefined,
          selectedTickets: event.eventType === 'GENERAL' ? selectedTickets : undefined,
          sessionId: controlState.sessionId,
          timestamp: new Date().toISOString()
        }));

        window.location.href = checkoutUrl;
      } else {
        throw new Error('No se pudo obtener el link de pago');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showToast(error instanceof Error ? error.message : 'Error al procesar la compra');
      if (event?.eventType === 'SEATED') {
        await fetchOccupiedSeats();
      }
    } finally {
      setUiState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [event, selectedSeats, selectedTickets, controlState.sessionId, fetchOccupiedSeats, showToast]);

  // Manejo de compartir
  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.name,
          text: `¡Mira este evento: ${event?.name}!`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('¡Link copiado al portapapeles!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [event?.name, showToast]);

  // Effects
  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Polling de estado para eventos con asientos
  useEffect(() => {
    if (event?._id && event.eventType === 'SEATED') {
      fetchOccupiedSeats();
      const interval = setInterval(fetchOccupiedSeats, 30000);
      setControlState(prev => ({ ...prev, pollingInterval: interval }));
      return () => clearInterval(interval);
    }
  }, [event?._id, event?.eventType, fetchOccupiedSeats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlState.pollingInterval) {
        clearInterval(controlState.pollingInterval);
      }
    };
  }, [controlState.pollingInterval]);

  // Renderizado condicional para estado de carga
  if (uiState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Cargando evento...</p>
        </motion.div>
      </div>
    );
  }

  // Renderizado condicional para errores
  if (uiState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="error" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <p>{uiState.error}</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </Alert>
      </div>
    );
  }

  // Renderizado condicional si no hay evento
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="warning" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <p>Evento no encontrado</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </Alert>
      </div>
    );
  }

  // Renderizado principal
  return (
    <>
      {event.imageUrl && (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90 z-10" />
          <Image
            src={event.imageUrl}
            alt="Background"
            fill
            className="object-cover blur-md brightness-50"
            priority
            quality={75}
            sizes="100vw"
          />
        </div>
      )}
      
      <div className="min-h-screen">
        <AdaptiveHeader title={event.name} />
        
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="backdrop-blur-sm bg-white/90">
                  <CardContent className="space-y-8">
                    <div className="flex items-center space-x-2 text-gray-500 pt-6">
                      <Calendar className="h-5 w-5" />
                      <span>
                        {new Date(event.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <Clock className="h-5 w-5 ml-4" />
                      <span>
                        {new Date(event.date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-5 w-5" />
                      <span>{event.location}</span>
                    </div>

                    {/* Tabs de información */}
                    <Tabs defaultValue="description" className="mt-6">
  <TabsList>
    <TabsTrigger value="description">Descripción</TabsTrigger>
    <TabsTrigger value="tickets">Tickets</TabsTrigger>
    {event.eventType === 'SEATED' && (
      <TabsTrigger value="prices">Precios</TabsTrigger>
    )}
  </TabsList>
  
  <TabsContent value="description">
    <div className="prose max-w-none">
      <p className="text-gray-700">{event.description}</p>
    </div>
  </TabsContent>
  <TabsContent value="tickets">
  {isSeatedEvent(event) ? (
    <TicketSelector
      event={{
        ...event,
        seatingChart: {
          ...event.seatingChart,
          seats: seats // Asegúrate de que seats está disponible
        }
      }}
      seats={seats}
      selectedSeats={selectedSeats}
      selectedTickets={[]}
      occupiedSeats={occupiedSeats}
      onSeatSelect={handleSeatSelect}
      onTicketSelect={() => {}}
      reservationTimeout={controlState.reservationTimeout}
      isLoading={uiState.loading}
    />
  ) : (
    <TicketSelector
      event={event as unknown as GeneralEvent}
      seats={[]}
      selectedSeats={[]}
      selectedTickets={selectedTickets}
      occupiedSeats={[]}
      onSeatSelect={() => {}}
      onTicketSelect={handleTicketSelect}
      reservationTimeout={null}
      isLoading={uiState.loading}
    />
  )}
</TabsContent>

  {event.eventType === 'SEATED' && (
    <TabsContent value="prices">
      <div className="space-y-2">
        {event.seatingChart.sections.map((section) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-between items-center bg-gray-50 p-2 rounded"
          >
            <span>{section.name}</span>
            <span className="font-semibold">
              ${section.price.toLocaleString('es-ES')}
            </span>
          </motion.div>
        ))}
      </div>
    </TabsContent>
  )}
</Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Columna lateral */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Resumen de compra */}
                <PurchaseSummary
  selectedSeats={event.eventType === 'SEATED' ? selectedSeats : []}
  selectedTickets={event.eventType === 'GENERAL' ? selectedTickets : []}
  sections={event.eventType === 'SEATED' ? event.seatingChart.sections : []}
  eventType={event.eventType}
  isProcessing={uiState.isProcessing}
  showBuyerForm={uiState.showBuyerForm}
  setShowBuyerForm={(show) => setUiState(prev => ({ ...prev, showBuyerForm: show }))}
  onSubmit={handlePurchase}
  onStartPurchase={handleStartPurchase}
/>

                {/* Compartir */}
                <Card className="backdrop-blur-sm bg-white/90 mt-4">
                  <CardHeader>
                    <CardTitle>Compartir Evento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleShare}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Sistema de notificaciones */}
        <AnimatePresence>
          {uiState.showNotification && (
            <Toast
              message={uiState.notificationMessage}
              onClose={() => setUiState(prev => ({
                ...prev,
                showNotification: false
              }))}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}