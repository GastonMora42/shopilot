'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IEvent, ISeatedEvent } from '@/types/event';
import Image from 'next/image';

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

  const isSeatedEvent = (event: IEvent): event is ISeatedEvent => {
    return event.eventType === 'SEATED' && 'seatingChart' in event;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Evento no encontrado</h2>
          <p className="text-gray-500">El evento que buscas no existe o ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative h-64 w-full">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-lg">Sin imagen</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
            <p className="text-gray-200">{new Date(event.date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Detalles principales */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Detalles del Evento</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <p className="text-gray-700">{event.description}</p>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Fecha y Hora</h3>
                    <p className="text-gray-600">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">Ubicación</h3>
                    <p className="text-gray-600">{event.location}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">Estado</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Asientos o Tickets */}
            <div>
              {isSeatedEvent(event) && event.seatingChart && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Configuración de Asientos</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Filas</h3>
                        <p className="text-gray-600">{event.seatingChart.rows}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Columnas</h3>
                        <p className="text-gray-600">{event.seatingChart.columns}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Secciones</h3>
                      <div className="space-y-3">
                        {event.seatingChart.sections.map((section, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{section.name}</h4>
                                <p className="text-sm text-gray-500">{section.type}</p>
                              </div>
                              <p className="text-lg font-semibold text-gray-900">
                                ${section.price}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Filas: {section.rowStart + 1} - {section.rowEnd + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {event.eventType === 'GENERAL' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Tickets Disponibles</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    {event.generalTickets.map((ticket, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-sm text-gray-500">{ticket.description}</p>
                            )}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${ticket.price}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Cantidad disponible: {ticket.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}