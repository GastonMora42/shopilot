// components/admin/EventForm/steps/ReviewStep.tsx
import React from 'react';
import { EventFormData, StepKey } from './SeatingMap/types';

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
            onClick={() => onEdit('BASIC_INFO')}
            className="text-blue-600 hover:text-blue-700"
          >
            Editar
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1">{data.basicInfo.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha</dt>
            <dd className="mt-1">{new Date(data.basicInfo.date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
            <dd className="mt-1">{data.basicInfo.location}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Descripción</dt>
            <dd className="mt-1">{data.basicInfo.description}</dd>
          </div>
        </dl>
      </div>

      {/* Event Type Section */}
      <div className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tipo de Evento</h3>
          <button
            onClick={() => onEdit('EVENT_TYPE')}
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
            onClick={() => onEdit('TICKETS')}
            className="text-blue-600 hover:text-blue-700"
          >
            Editar
          </button>
        </div>
        {data.eventType === 'SEATED' ? (
          <div>
            <p className="mb-2">Configuración de Asientos:</p>
            <ul className="list-disc pl-5">
              {data.seating?.sections.map((section: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; price: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => (
                <li key={section.id}>
                  {section.name}: ${section.price}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="mb-2">Tipos de Entrada:</p>
            <ul className="list-disc pl-5">
              {data.generalTickets.map((ticket: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; price: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => (
                <li key={ticket.id}>
                  {ticket.name}: ${ticket.price} ({ticket.quantity} disponibles)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};