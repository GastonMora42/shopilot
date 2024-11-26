// components/admin/EventForm/steps/ReviewStep.tsx
import React from 'react';
import { EventFormData, StepKey } from '@/types/event';

interface ReviewStepProps {
  data: EventFormData;
  onEdit: (step: StepKey) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data, onEdit }) => {
  return (
    <div className="space-y-8">
      {/* Basic Info Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Información Básica</h3>
          <button
            onClick={() => onEdit('info')}
            className="text-blue-600 hover:text-blue-700"
          >
            Editar
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1">{data.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha</dt>
            <dd className="mt-1">
              {data.date ? new Date(data.date).toLocaleDateString() : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
            <dd className="mt-1">{data.location}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1">{data.description}</dd>
          </div>
        </dl>
        {data.imageUrl && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-gray-500">Imagen</dt>
            <dd className="mt-1">
              <img 
                src={data.imageUrl} 
                alt="Imagen del evento" 
                className="w-48 h-48 object-cover rounded-lg"
              />
            </dd>
          </div>
        )}
      </div>

      {/* Event Type Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tipo de Evento</h3>
          <button
            onClick={() => onEdit('type')}
            className="text-blue-600 hover:text-blue-700"
          >
            Editar
          </button>
        </div>
        <p>{data.eventType === 'SEATED' ? 'Con Asientos' : 'Entrada General'}</p>
      </div>

      {/* Tickets Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Entradas</h3>
          <button
            onClick={() => onEdit('tickets')}
            className="text-blue-600 hover:text-blue-700"
          >
            Editar
          </button>
        </div>
        
        {data.eventType === 'SEATED' ? (
          <div>
            <p className="mb-2">Configuración de Asientos:</p>
            {data.seatingChart && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dimensiones</p>
                  <p>Filas: {data.seatingChart.rows}, Columnas: {data.seatingChart.columns}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Secciones</p>
                  <ul className="list-disc pl-5 mt-2">
                    {data.seatingChart.sections.map((section) => (
                      <li key={section.id} className="mb-2">
                        <span className="font-medium">{section.name}</span>
                        <br />
                        Precio: ${section.price}
                        <br />
                        Tipo: {section.type}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-2">Tipos de Entrada:</p>
            {data.generalTickets && data.generalTickets.length > 0 ? (
              <ul className="list-disc pl-5">
                {data.generalTickets.map((ticket) => (
                  <li key={ticket.id} className="mb-2">
                    <span className="font-medium">{ticket.name}</span>
                    <br />
                    Precio: ${ticket.price}
                    <br />
                    Cantidad disponible: {ticket.quantity}
                    {ticket.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {ticket.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No se han configurado entradas</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};