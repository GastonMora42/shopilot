import React from 'react';
import { EventFormData, StepKey } from '@/types/event';
import { motion } from 'framer-motion';

interface ReviewStepProps {
  data: EventFormData;
  onEdit: (step: StepKey) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onEdit }) => {
  // Calcular estadísticas de asientos y entradas
  const eventStats = React.useMemo(() => {
    if (data.eventType === 'SEATED' && data.seatingChart) {
      const sectionStats = data.seatingChart.sections.map(section => {
        const sectionSeats = data.seatingChart!.seats.filter(
          seat => seat.sectionId === section.name
        );
        return {
          name: section.name,
          seats: sectionSeats.length,
          price: section.price,
          type: section.type,
          totalValue: sectionSeats.length * section.price
        };
      });

      return {
        totalSeats: data.seatingChart.seats.length,
        sectionStats,
        totalValue: sectionStats.reduce((sum, section) => sum + section.totalValue, 0)
      };
    } else if (data.eventType === 'GENERAL' && data.generalTickets) {
      return {
        totalTickets: data.generalTickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
        totalValue: data.generalTickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0)
      };
    }
    return null;
  }, [data]);

  const ReviewSection = ({ 
    title, 
    children, 
    onEditClick 
  }: { 
    title: string; 
    children: React.ReactNode; 
    onEditClick: () => void 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={onEditClick}
          className="px-3 py-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Editar
        </button>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Resumen del Evento
      </h2>

      {/* Información Básica */}
      <ReviewSection title="Información Básica" onEditClick={() => onEdit('info')}>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre del Evento</dt>
            <dd className="mt-1 text-lg text-gray-900">{data.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha y Hora</dt>
            <dd className="mt-1 text-lg text-gray-900">
              {new Date(data.date).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
            <dd className="mt-1 text-lg text-gray-900">{data.location}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1 text-gray-900 whitespace-pre-line">
              {data.description}
            </dd>
          </div>
        </div>
        {data.imageUrl && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500 mb-2">Imagen del Evento</dt>
            <dd className="mt-1">
              <img 
                src={data.imageUrl} 
                alt={data.name}
                className="w-64 h-40 object-cover rounded-lg shadow-md"
              />
            </dd>
          </div>
        )}
      </ReviewSection>

      {/* Configuración de Entradas */}
      <ReviewSection 
        title="Configuración de Entradas" 
        onEditClick={() => onEdit('tickets')}
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              {data.eventType === 'SEATED' ? 'Evento con Asientos' : 'Entrada General'}
            </span>
          </div>

          {/* Sección para eventos con asientos */}
          {data.eventType === 'SEATED' && data.seatingChart && eventStats && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Dimensiones del Mapa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Filas:</span>
                    <span className="ml-2 font-medium">{data.seatingChart.rows}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Columnas:</span>
                    <span className="ml-2 font-medium">{data.seatingChart.columns}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Total de Asientos:</span>
                    <span className="ml-2 font-medium">{eventStats.totalSeats}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-4">Secciones</h4>
                <div className="grid gap-4">
                  {eventStats.sectionStats?.map((section, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{section.name}</h5>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              Tipo: {section.type}
                            </p>
                            <p className="text-sm text-gray-600">
                              Asientos: {section.seats}
                            </p>
                            <p className="text-sm text-gray-600">
                              Precio por asiento: ${section.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Valor Total</p>
                          <p className="text-lg font-medium text-gray-900">
                            ${section.totalValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección para eventos generales */}
          {data.eventType === 'GENERAL' && data.generalTickets && eventStats && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">Resumen de Entradas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Total de Entradas:</span>
                    <span className="ml-2 font-medium">{eventStats.totalTickets}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor Total:</span>
                    <span className="ml-2 font-medium">${eventStats.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-4">Tipos de Entrada</h4>
                <div className="grid gap-4">
                  {data.generalTickets.map((ticket, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{ticket.name}</h5>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              Cantidad: {ticket.quantity}
                            </p>
                            <p className="text-sm text-gray-600">
                              Precio: ${ticket.price.toLocaleString()}
                            </p>
                            {ticket.description && (
                              <p className="text-sm text-gray-500 mt-2">
                                {ticket.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Valor Total</p>
                          <p className="text-lg font-medium text-gray-900">
                            ${(ticket.price * ticket.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Total general */}
          {eventStats && (
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">
                  Valor Total del Evento
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ${eventStats.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </ReviewSection>
    </div>
  );
};