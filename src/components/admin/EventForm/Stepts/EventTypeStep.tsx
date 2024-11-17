// components/admin/EventForm/steps/EventTypeStep.tsx
import React from 'react';

export type EventType = 'GENERAL' | 'SEATED';

interface EventTypeStepProps {
  selectedType: EventType | null;
  onSelect: (type: EventType) => void;
}

export const EventTypeStep: React.FC<EventTypeStepProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Tipo de Evento</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onSelect('GENERAL')}
          className={`p-6 border rounded-lg text-left transition-all ${
            selectedType === 'GENERAL'
              ? 'border-blue-500 bg-blue-50'
              : 'hover:border-gray-400'
          }`}
        >
          <h4 className="font-medium mb-2">Entrada General</h4>
          <p className="text-sm text-gray-600">
            Para eventos sin asientos asignados. Ideal para conciertos al aire libre,
            festivales, y eventos similares.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect('SEATED')}
          className={`p-6 border rounded-lg text-left transition-all ${
            selectedType === 'SEATED'
              ? 'border-blue-500 bg-blue-50'
              : 'hover:border-gray-400'
          }`}
        >
          <h4 className="font-medium mb-2">Con Asientos</h4>
          <p className="text-sm text-gray-600">
            Para eventos con asientos numerados. Ideal para teatros,
            cines, y eventos con ubicaciones específicas.
          </p>
        </button>
      </div>
    </div>
  );
};
