'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Share2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { IEvent } from '@/types';
import { SeatSelector } from '@/components/events/SeatSelector';
import { BuyerForm } from '@/components/events/BuyerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Toast } from '@/components/ui/Toast';
import DebugPanel from '@/components/DebugPanel';

interface OccupiedSeat {
  seatId: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reservationTimeout, setReservationTimeout] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSessionId(crypto.randomUUID());
    fetchEvent();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (event?._id) {
      fetchOccupiedSeats();
      const interval = setInterval(fetchOccupiedSeats, 30000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
  }, [event?._id]);

  useEffect(() => {
    console.log('Current selected seats:', selectedSeats);
    console.log('Current occupied seats:', occupiedSeats);
  }, [selectedSeats, occupiedSeats]);

  const showToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/public/${params.slug}`);
      if (!response.ok) throw new Error('Evento no encontrado');
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      setError('Error al cargar el evento');
      showToast('No se pudo cargar el evento. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupiedSeats = async () => {
    if (!event?._id) return;
  
    try {
      const response = await fetch(`/api/events/${event._id}/seats`);
      if (!response.ok) throw new Error('Error al obtener asientos');
      
      const data = await response.json();
      console.log('Seats data:', data); // Para debugging
      
      if (data.occupiedSeats) {
        const formattedSeats = data.occupiedSeats.map((seat: any) => ({
          seatId: seat.seatId, // Ya viene en formato "1-1"
          status: seat.status
        }));
        
        console.log('Formatted occupied seats:', formattedSeats);
        setOccupiedSeats(formattedSeats);
  
        // Actualizar selección si algún asiento ya no está disponible
        setSelectedSeats(prev => 
          prev.filter(seatId => 
            !formattedSeats.some(
              (seat: { seatId: string; status: string; }) => 
                seat.seatId === seatId && 
                ['OCCUPIED', 'RESERVED'].includes(seat.status)
            )
          )
        );
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      showToast('Error al actualizar el estado de los asientos');
    }
  };


  const handleSeatSelection = async (newSelectedSeats: string[]) => {
    try {
      console.log('Attempting to select seats:', newSelectedSeats); // Para debugging
  
      if (!sessionId || !event?._id) {
        showToast('Error de sesión. Por favor, recarga la página.');
        return;
      }
  
      const response = await fetch(`/api/events/${event._id}/seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          seatIds: newSelectedSeats, // Estos ya vienen en formato "1-1"
          sessionId 
        })
      });
  
      const data = await response.json();
      console.log('API Response:', data); // Para debugging
      
      if (!response.ok) {
        if (data.unavailableSeats) {
          setOccupiedSeats(prev => [
            ...prev,
            ...data.unavailableSeats.map((seat: any) => ({
              seatId: seat.seatId,
              status: 'OCCUPIED'
            }))
          ]);
          showToast('Algunos asientos ya no están disponibles');
          await fetchOccupiedSeats();
          return;
        }
        throw new Error(data.error || 'Error al reservar asientos');
      }
  
      setSelectedSeats(newSelectedSeats);
      if (data.expiresAt) {
        setReservationTimeout(new Date(data.expiresAt).getTime());
      }
  
    } catch (error) {
      console.error('Error selecting seats:', error);
      showToast('Error al seleccionar asientos. Por favor, intenta de nuevo.');
      await fetchOccupiedSeats();
    }
  };

  const handlePurchase = async (buyerInfo: {
    name: string;
    email: string;
    dni: string;
    phone?: string;
  }) => {
    setIsProcessing(true);
    try {
      if (!sessionId || !event?._id) {
        throw new Error('Sesión inválida');
      }

      // Verificar estado actual de los asientos
      const checkResponse = await fetch(`/api/events/${event._id}/seats/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatIds: selectedSeats,
          sessionId
        })
      });
      
      const checkData = await checkResponse.json();
      
      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Los asientos seleccionados no están disponibles');
      }

      const purchaseResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          seats: selectedSeats,
          buyerInfo,
          sessionId
        })
      });

      const purchaseData = await purchaseResponse.json();
      
      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || 'Error al procesar la compra');
      }

      if (purchaseData.checkoutUrl) {
        // Almacenar datos de la compra en localStorage para recuperación post-pago
        localStorage.setItem('lastPurchaseAttempt', JSON.stringify({
          eventId: event._id,
          ticketId: purchaseData.ticket?.id,
          seats: selectedSeats,
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
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
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
  };

  const calculateTotal = () => {
    if (!event) return 0;
    
    return selectedSeats.reduce((total, seatId) => {
      const [rowNum] = seatId.split('-'); // Ejemplo: "1-1" nos da ["1", "1"]
      const rowNumber = parseInt(rowNum, 10); // Convertimos a número
      
      const section = event.seatingChart.sections.find(section => {
        // Comprobamos si la fila está dentro del rango de la sección
        return rowNumber >= section.rowStart && rowNumber <= section.rowEnd;
      });
  
      if (!section) {
        console.warn(`No se encontró sección para el asiento ${seatId}`);
        return total;
      }
  
      console.log('Calculando precio para:', {
        seatId,
        rowNumber,
        sectionName: section.name,
        price: section.price
      });
  
      return total + section.price;
    }, 0);
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="error" className="max-w-md">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Volver al inicio
          </Button>
        </Alert>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            {event.name}
          </motion.h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="p-0">
                  <div className="relative w-full h-[400px]">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={`Imagen de ${event.name}`}
                        fill
                        className="object-cover rounded-t-lg"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-400">No hay imagen disponible</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 text-gray-500">
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

                  <Tabs defaultValue="description">
                    <TabsList>
                      <TabsTrigger value="description">Descripción</TabsTrigger>
                      <TabsTrigger value="seating">Asientos</TabsTrigger>
                      <TabsTrigger value="prices">Precios</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="description">
                      <p className="text-gray-700">{event.description}</p>
                    </TabsContent>

                    <TabsContent value="seating">
                      <div className="bg-white rounded-lg p-4">
                        <SeatSelector
                          seatingChart={event.seatingChart}
                          selectedSeats={selectedSeats}
                          occupiedSeats={occupiedSeats}
                          onSeatSelect={handleSeatSelection}
                          reservationTimeout={reservationTimeout}
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
                            <span className="font-semibold">${section.price}</span>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex justify-between text-lg font-bold">
  <span>Total:</span>
  <span>
    ${calculateTotal().toLocaleString('es-ES')}
  </span>
</div>
                <div className="flex justify-between">
  <span>Asientos seleccionados:</span>
  <span>
    {selectedSeats.length > 0 
      ? selectedSeats.map(seatId => {
          const [row, col] = seatId.split('-');
          const displayId = `${String.fromCharCode(64 + parseInt(row))}${col}`;
          return displayId;
        }).join(', ')
      : 'Ninguno'
    }
  </span>
</div>

                  {showBuyerForm ? (
                    <BuyerForm
                      onSubmit={handlePurchase}
                      isLoading={isProcessing}
                    />
                  ) : (
                    <Button
                      className="w-full"
                      disabled={selectedSeats.length === 0}
                      onClick={() => setShowBuyerForm(true)}
                    >
                      Continuar con la compra
                    </Button>
                  )}
                </CardContent>
              </Card>

              {process.env.NODE_ENV === 'development' && (
                <DebugPanel eventId={event._id} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Compartir Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showNotification && (
          <Toast
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}