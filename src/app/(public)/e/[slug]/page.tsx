'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Share2, AlertCircle, X } from 'lucide-react';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { IEvent } from '@/types';
import { SeatSelector } from '@/components/events/SeatSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Toast } from '@/components/ui/Toast';
import DebugPanel from '@/components/DebugPanel';
import { PurchaseSummary } from '@/components/ui/PurchaseSummary';
import { AdaptiveHeader } from '@/components/ui/AdaptativeHeader';

interface TemporaryReservation {
  sessionId: string;
  expiresAt: Date;
}

interface OccupiedSeat {
  seatId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  temporaryReservation?: TemporaryReservation;
}

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

// Componente de fondo animado optimizado
const AnimatedBackground = memo(function AnimatedBackground({ imageUrl }: { imageUrl: string }) {
  const controls = useAnimation();
  useEffect(() => {
    let isMounted = true;

    const animate = async () => {
      while (isMounted) {
        await controls.start({
          scale: [1.1, 1.15, 1.1],
          x: [10, -10, 10],
          y: [10, -10, 10],
          transition: {
            duration: 30,
            ease: "linear",
            repeat: Infinity
          }
        });
      }
    };

    animate();
    return () => { isMounted = false; };
  }, [controls]);

  return (
    <motion.div
      className="fixed inset-0 w-screen h-screen overflow-hidden -z-10"
      initial={{ scale: 1.1 }}
      animate={controls}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90 z-10" />
      <Image
        src={imageUrl}
        alt="Background"
        fill
        className="object-cover blur-md brightness-50"
        priority
        quality={75}
        loading="eager"
        sizes="100vw"
      />
    </motion.div>
  );
});

// Componente de imagen del evento optimizado
const EventImage = memo(function EventImage({ 
  imageUrl, 
  eventName 
}: { 
  imageUrl: string; 
  eventName: string; 
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <>
      <motion.div
        className="relative w-full h-[400px] overflow-hidden rounded-t-lg cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-lg" />
        )}
        <motion.div
          className="relative w-full h-full"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={imageUrl}
            alt={`Imagen de ${eventName}`}
            fill
            className={`object-cover rounded-t-lg transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
            onLoadingComplete={() => setImageLoading(false)}
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isHovered ? 1 : 0.8 }}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-full"
              >
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={imageUrl}
                alt={`Imagen de ${eventName}`}
                width={1200}
                height={800}
                className="object-contain w-full h-full rounded-lg"
              />
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
                onClick={() => setShowModal(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

// Componente principal
export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  
  // Estados principales
  const [event, setEvent] = useState<IEvent | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeat[]>([]);

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
  const fetchEvent = useCallback(async () => {
    try {
      setUiState(prev => ({ ...prev, loading: true }));
      const response = await fetch(`/api/events/public/${params.slug}`);
      if (!response.ok) throw new Error('Evento no encontrado');
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      setUiState(prev => ({
        ...prev,
        error: 'Error al cargar el evento'
      }));
      showToast('No se pudo cargar el evento. Por favor, intenta de nuevo.');
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, [params.slug, showToast]);
  // Continuación de PublicEventPage.tsx

  // Fetch de asientos ocupados
  const fetchOccupiedSeats = useCallback(async () => {
    if (!event?._id) return;
  
    try {
      console.log('Fetching seats for event:', event._id);
      const response = await fetch(`/api/events/${event._id}/seats`);
      
      if (!response.ok) {
        throw new Error('Error al obtener asientos');
      }
      
      const data = await response.json();
      console.log('Received seats data:', data);
  
      if (data.occupiedSeats) {
        // Actualizar estado de asientos ocupados
        setOccupiedSeats(data.occupiedSeats);
  
        // Actualizar selección si algún asiento ya no está disponible
        setSelectedSeats(prev => 
          prev.filter(seatId => {
            const seat = data.occupiedSeats.find((s: OccupiedSeat) => s.seatId === seatId);
            if (!seat) return true;
            if (seat.status === 'AVAILABLE') return true;
            if (seat.status === 'RESERVED' && 
                seat.temporaryReservation?.sessionId === controlState.sessionId) {
              return true;
            }
            return false;
          })
        );
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      showToast('Error al actualizar el estado de los asientos');
    }
  }, [event?._id, controlState.sessionId, showToast]);

  // Manejo de selección de asientos
  const handleSeatSelection = useCallback(async (newSelectedSeats: string[]) => {
    try {
      // Solo actualizamos el estado local de selección
      setSelectedSeats(newSelectedSeats);
    } catch (error) {
      console.error('Error selecting seats:', error);
      showToast('Error al seleccionar asientos. Por favor, intenta de nuevo.');
    }
  }, []);
  
  // Nuevo método para manejar el inicio de la compra
  const handleStartPurchase = useCallback(async () => {
    try {
      if (!controlState.sessionId || !event?._id) {
        showToast('Error de sesión. Por favor, recarga la página.');
        return;
      }
  
      // Ahora sí hacemos la reserva cuando el usuario quiere comprar
      const reserveResponse = await fetch(`/api/events/${event._id}/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatIds: selectedSeats,
          sessionId: controlState.sessionId 
        })
      });
  
      const reserveData = await reserveResponse.json();
      
      if (!reserveResponse.ok) {
        if (reserveData.unavailableSeats) {
          showToast('Algunos asientos ya no están disponibles');
          await fetchOccupiedSeats();
          return;
        }
        throw new Error(reserveData.error || 'Error al reservar asientos');
      }
  
      // Configurar timeout de reserva
      if (reserveData.expiresAt) {
        const expiresAt = new Date(reserveData.expiresAt).getTime();
        setControlState(prev => ({
          ...prev,
          reservationTimeout: expiresAt
        }));
      }
  
      // Mostrar formulario de compra
      setUiState(prev => ({ ...prev, showBuyerForm: true }));
  
    } catch (error) {
      console.error('Error starting purchase:', error);
      showToast('Error al iniciar la compra. Por favor, intenta de nuevo.');
      await fetchOccupiedSeats();
    }
  }, [event?._id, selectedSeats, controlState.sessionId, fetchOccupiedSeats, showToast]);

  // Manejo de compra
  const handlePurchase = useCallback(async (buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  }) => {
    setUiState(prev => ({ ...prev, isProcessing: true }));
    try {
      if (!controlState.sessionId || !event?._id) {
        throw new Error('Sesión inválida');
      }

      // Verificar reserva de asientos
      const verifyResponse = await fetch(`/api/events/${event._id}/seats/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds: selectedSeats,
          sessionId: controlState.sessionId
        })
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        throw new Error(verifyData.error || 'Los asientos seleccionados no están disponibles');
      }

      // Procesar compra
      const purchaseResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          seats: selectedSeats,
          buyerInfo,
          sessionId: controlState.sessionId
        })
      });

      const purchaseData = await purchaseResponse.json();
      
      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || 'Error al procesar la compra');
      }

      if (purchaseData.checkoutUrl) {
        // Guardar información de compra en localStorage
        localStorage.setItem('lastPurchaseAttempt', JSON.stringify({
          eventId: event._id,
          ticketId: purchaseData.ticket?.id,
          seats: selectedSeats,
          sessionId: controlState.sessionId,
          timestamp: new Date().toISOString()
        }));

        window.location.href = purchaseData.checkoutUrl;
      } else {
        throw new Error('No se pudo obtener el link de pago');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showToast(error instanceof Error ? error.message : 'Error al procesar la compra');
      await fetchOccupiedSeats();
    } finally {
      setUiState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [event?._id, selectedSeats, controlState.sessionId, fetchOccupiedSeats, showToast]);

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

  // Polling de estado
  useEffect(() => {
    if (event?._id) {
      fetchOccupiedSeats();
      const interval = setInterval(fetchOccupiedSeats, 30000); // cada 30 segundos
      setControlState(prev => ({ ...prev, pollingInterval: interval }));
  
      return () => clearInterval(interval);
    }
  }, [event?._id, fetchOccupiedSeats]);
  // Continuación de PublicEventPage.tsx

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
      {event.imageUrl && <AnimatedBackground imageUrl={event.imageUrl} />}
      
      <div className="min-h-screen">
      <AdaptiveHeader title={event.name} />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna principal con información del evento */}
            <div className="md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="backdrop-blur-sm bg-white/90">
                  <CardHeader className="p-0">
                    {event.imageUrl && (
                      <EventImage 
                        imageUrl={event.imageUrl} 
                        eventName={event.name} 
                      />
                    )}
                  </CardHeader>
                  <CardContent className="space-y-8"> 
  <div className="flex items-center space-x-2 text-gray-500 pt-6">
    <Calendar className="h-5 w-5" />
    <span>{new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</span>
    <Clock className="h-5 w-5 ml-4" />
    <span>{new Date(event.date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}</span>
  </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-5 w-5" />
                      <span>{event.location}</span>
                    </div>

                    {/* Tabs de información */}
                    <Tabs defaultValue="description" className="mt-6">
                      <TabsList>
                        <TabsTrigger value="description">Descripción</TabsTrigger>
                        <TabsTrigger value="seating">Asientos</TabsTrigger>
                        <TabsTrigger value="prices">Precios</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="description">
                        <div className="prose max-w-none">
                          <p className="text-gray-700">{event.description}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="seating">
                        <div className="relative">
                        <SeatSelector
      eventId={event._id}
      seatingChart={event.seatingChart}
      selectedSeats={selectedSeats}
      occupiedSeats={occupiedSeats}
      onSeatSelect={handleSeatSelection}
      reservationTimeout={controlState.reservationTimeout}
      maxSeats={6}
    />
                        </div>
                      </TabsContent>

                      <TabsContent value="prices">
                        <div className="space-y-2">
                          {event.seatingChart.sections.map((section) => (
                            <motion.div 
                              key={section.name}
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
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Columna lateral con resumen y acciones */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Resumen de compra */}
                <PurchaseSummary
  selectedSeats={selectedSeats}
  sections={event.seatingChart.sections}
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

                {/* Panel de debug en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <DebugPanel eventId={event._id} />
                )}
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