// components/admin/EventForm/steps/BasicInfoStep.tsx
import React, { useEffect, useState } from 'react';

interface BasicInfoData {
  name: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  imageUrl?: string;
}

interface BasicInfoStepProps {
  data: BasicInfoData;
  onChange: (data: Partial<BasicInfoData>) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, onChange }) => {
  // Estado local para seguir los cambios en los campos de fecha
  const [startDate, setStartDate] = useState(data.date || '');
  const [endDate, setEndDate] = useState(data.endDate || '');

  // Función para validar que endDate sea posterior a date
  const validateEndDate = (end: string, start: string) => {
    if (!start || !end) return true;
    return new Date(end) > new Date(start);
  };

  // Efecto para actualizar los estados locales cuando cambian los datos externos
  useEffect(() => {
    setStartDate(data.date || '');
    setEndDate(data.endDate || '');
  }, [data.date, data.endDate]);

  // Efecto para establecer fecha de finalización por defecto
  useEffect(() => {
    if (startDate && !endDate) {
      try {
        const date = new Date(startDate);
        date.setHours(date.getHours() + 24);
        // Formato para datetime-local: YYYY-MM-DDThh:mm
        const formattedDate = date.toISOString().slice(0, 16);
        setEndDate(formattedDate);
        onChange({ endDate: formattedDate });
      } catch (e) {
        console.error("Error al calcular fecha de finalización:", e);
      }
    }
  }, [startDate, endDate, onChange]);

  // Manejador de cambio para fecha de inicio
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log("Nueva fecha de inicio:", newDate);
    setStartDate(newDate);
    onChange({ date: newDate });
    
    // Actualizar fecha de finalización si existe pero ya no es válida
    if (endDate && !validateEndDate(endDate, newDate)) {
      try {
        const date = new Date(newDate);
        date.setHours(date.getHours() + 24);
        const formattedDate = date.toISOString().slice(0, 16);
        setEndDate(formattedDate);
        onChange({ endDate: formattedDate });
      } catch (e) {
        console.error("Error al actualizar fecha de finalización:", e);
      }
    }
  };

  // Manejador de cambio para fecha de finalización
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    console.log("Nueva fecha de finalización:", newEndDate);
    setEndDate(newEndDate);
    // Retraso pequeño para asegurar que el valor se capture correctamente
    setTimeout(() => {
      onChange({ endDate: newEndDate });
    }, 0);
  };

  // Manejador para el botón de establecer 24h después
  const handleSet24HoursLater = () => {
    if (!startDate) return;
    
    try {
      const date = new Date(startDate);
      date.setHours(date.getHours() + 24);
      const formattedDate = date.toISOString().slice(0, 16);
      setEndDate(formattedDate);
      onChange({ endDate: formattedDate });
    } catch (e) {
      console.error("Error al establecer +24h:", e);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Información Básica del Evento</h3>
      
      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del Evento
        </label>
        <input
          id="event-name"
          type="text"
          required
          className="w-full p-2 border rounded-md"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          id="event-description"
          required
          rows={4}
          className="w-full p-2 border rounded-md"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora de Inicio
          </label>
          <input
            id="event-start-date"
            type="datetime-local"
            required
            className="w-full p-2 border rounded-md"
            value={startDate}
            onChange={handleStartDateChange}
          />
        </div>

        <div>
          <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora de Finalización
          </label>
          <div className="flex gap-2">
            <input
              id="event-end-date"
              type="datetime-local"
              required
              className={`flex-1 p-2 border rounded-md ${
                endDate && !validateEndDate(endDate, startDate) ? 'border-red-500' : ''
              }`}
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
            />
            <button
              type="button"
              onClick={handleSet24HoursLater}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
              title="Establecer 24 horas después del inicio"
            >
              +24h
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Los tickets serán válidos hasta esta fecha/hora.
          </p>
          {endDate && !validateEndDate(endDate, startDate) && (
            <p className="text-xs text-red-500 mt-1">
              La fecha de finalización debe ser posterior a la fecha de inicio
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación
          </label>
          <input
            id="event-location"
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="event-image" className="block text-sm font-medium text-gray-700 mb-2">
          Imagen del Evento (opcional)
        </label>
        <input
          id="event-image"
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