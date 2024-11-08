'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { IEvent } from '@/types';
import { SeatSelector } from '@/components/events/SeatSelector';
import { BuyerForm } from '@/components/events/BuyerForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ISeat } from '@/app/models/Seat';


interface OccupiedSeat {
  seatId: string;
  status: 'available' | 'occupied' | 'reserved';
}

export default function PublicEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [occupiedSeats, setOccupiedSeats] = useState<OccupiedSeat[]>([]);


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

// En PublicEventPage
const fetchOccupiedSeats = async () => {
  if (!event?._id) return;

  try {
    console.log('Fetching occupied seats for event:', event._id);
    const response = await fetch(`/api/events/${event._id}/seats`);
    
    if (!response.ok) {
      throw new Error('Error al obtener asientos');
    }
    
    const data = await response.json();
    console.log('Received occupied seats:', data);
    
    if (Array.isArray(data.occupiedSeats)) {
      const formattedSeats = data.occupiedSeats.map((seat: { seatId: number; status: string; }) => ({
        seatId: seat.seatId,
        status: seat.status
      }));
      console.log('Setting occupied seats:', formattedSeats);
      setOccupiedSeats(formattedSeats);
    }
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
  }
};

    // Agregamos un nuevo useEffect para actualizar los asientos ocupados periódicamente
    useEffect(() => {
      if (event?._id) {
        fetchOccupiedSeats();
        // Actualizar cada 30 segundos
        const interval = setInterval(fetchOccupiedSeats, 30000);
        return () => clearInterval(interval);
      }
    }, [event?._id]);

  const calculateTotal = () => {
    if (!event) return 0;
    return selectedSeats.reduce((total, seatId) => {
      const [row] = seatId.split('');
      const rowIndex = row.charCodeAt(0) - 65;
      const section = event.seatingChart.sections.find(section =>
        rowIndex >= section.rowStart && rowIndex <= section.rowEnd
      );
      return total + (section?.price || 0);
    }, 0);
  };

  const handleSeatSelection = async (newSelectedSeats: string[]) => {
    // Si estamos deseleccionando asientos, simplemente actualizamos el estado
    if (newSelectedSeats.length < selectedSeats.length) {
      setSelectedSeats(newSelectedSeats);
      return;
    }

    // Si estamos seleccionando nuevos asientos, intentamos reservarlos
    const newSeats = newSelectedSeats.filter(seat => !selectedSeats.includes(seat));
    
    try {
      const response = await fetch(`/api/events/${event?._id}/seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: newSeats })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Si algunos asientos ya no están disponibles, actualizamos la lista de ocupados
        if (data.unavailableSeats) {
          setOccupiedSeats(prev => [...prev, ...data.unavailableSeats]);
          throw new Error('Algunos asientos ya no están disponibles');
        }
        throw new Error(data.error || 'Error al reservar asientos');
      }

      // Si todo salió bien, actualizamos los asientos seleccionados
      setSelectedSeats(newSelectedSeats);
    } catch (error) {
      console.error('Error reserving seats:', error);
      // Actualizamos la lista de asientos ocupados
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
      // Primero verificamos que los asientos aún estén disponibles
      const response = await fetch(`/api/events/${event?._id}/seats`);
      const data = await response.json();
      
      const unavailableSeats = data.occupiedSeats
        .map((seat: { seatId: string; }) => seat.seatId)
        .filter((seatId: string) => selectedSeats.includes(seatId));

      if (unavailableSeats.length > 0) {
        throw new Error('Algunos asientos seleccionados ya no están disponibles');
      }

      // Si los asientos están disponibles, procedemos con la compra
      const purchaseResponse = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event?._id,
          seats: selectedSeats,
          buyerInfo
        })
      });

      const purchaseData = await purchaseResponse.json();
      
      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || 'Error al procesar la compra');
      }

      if (purchaseData.checkoutUrl) {
        window.location.href = purchaseData.checkoutUrl;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar la compra');
      // Actualizamos la lista de asientos ocupados
      await fetchOccupiedSeats();
    } finally {
      setIsProcessing(false);
    }
  };

  // Comparte el enlace del evento
  const handleShare = async () => {
    const eventUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.name,
          text: event?.description,
          url: eventUrl,
        });
      } else {
        await navigator.clipboard.writeText(eventUrl);
        // Aquí podrías mostrar un toast o notificación de que se copió el enlace
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!event) return <div className="p-6 text-center">Evento no encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <img 
                  src={event.image || "/placeholder.svg"}
                  alt="Imagen del evento" 
                  className="w-full h-64 object-cover rounded-t-lg"
                />
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
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="prices">
                    <div className="space-y-2">
                      {event.seatingChart.sections.map((section) => (
                        <div 
                          key={section.name}
                          className="flex justify-between items-center bg-gray-50 p-2 rounded"
                        >
                          <span>{section.name}</span>
                          <span className="font-semibold">${section.price}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Asientos seleccionados:</span>
                  <span>{selectedSeats.join(', ') || 'Ninguno'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal()}</span>
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

            <Card>
              <CardHeader>
                <CardTitle>Compartir Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}