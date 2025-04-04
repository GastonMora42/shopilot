// components/admin/EventForm/steps/BasicInfoStep.tsx
import React from 'react';

interface BasicInfoData {
  name: string;
  description: string;
  date: string;
  endDate?: string; // Nuevo campo
  location: string;
  imageUrl?: string;
}

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (data: Partial<BasicInfoData>) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Información Básica del Evento</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Evento
        </label>
        <input
          type="text"
          required
          className="w-full p-2 border rounded-md"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          required
          rows={4}
          className="w-full p-2 border rounded-md"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora de Inicio
          </label>
          <input
            type="datetime-local"
            required
            className="w-full p-2 border rounded-md"
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora de Finalización
          </label>
          <input
            type="datetime-local"
            className="w-full p-2 border rounded-md"
            required
            value={data.endDate || ''}
            onChange={(e) => onChange({ endDate: e.target.value })}
            min={data.date} // Para evitar fechas anteriores al inicio
          />
          <p className="text-xs text-gray-500 mt-1">
            Hasta esta fecha/hora se podrán escanear tickets de ingreso
          </p>
        </div>
        

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Imagen del Evento (opcional)
        </label>
        <input
          type="url"
          className="w-full p-2 border rounded-md"
          value={data.imageUrl || ''}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
          placeholder="URL de la imagen"
        />
      </div>
    </div>
  );
};

