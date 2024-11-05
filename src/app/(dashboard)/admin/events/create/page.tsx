// app/(admin)/admin/events/create/page.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    price: '',
    totalSeats: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          price: Number(eventData.price),
          totalSeats: Number(eventData.totalSeats),
          availableSeats: Number(eventData.totalSeats)
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el evento');
      }

      const event = await response.json();
      router.push(`/admin/events/${event._id}`);
    } catch (error) {
      console.error('Error:', error);
      // Aquí puedes agregar un manejo de errores más amigable
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Evento</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre del Evento
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={eventData.name}
            onChange={(e) => setEventData(prev => ({
              ...prev,
              name: e.target.value
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Descripción
          </label>
          <textarea
            required
            className="w-full p-2 border rounded"
            rows={4}
            value={eventData.description}
            onChange={(e) => setEventData(prev => ({
              ...prev,
              description: e.target.value
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Fecha y Hora
            </label>
            <input
              type="datetime-local"
              required
              className="w-full p-2 border rounded"
              value={eventData.date}
              onChange={(e) => setEventData(prev => ({
                ...prev,
                date: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ubicación
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded"
              value={eventData.location}
              onChange={(e) => setEventData(prev => ({
                ...prev,
                location: e.target.value
              }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Precio
            </label>
            <input
              type="number"
              required
              min="0"
              className="w-full p-2 border rounded"
              value={eventData.price}
              onChange={(e) => setEventData(prev => ({
                ...prev,
                price: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cantidad de Asientos
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-2 border rounded"
              value={eventData.totalSeats}
              onChange={(e) => setEventData(prev => ({
                ...prev,
                totalSeats: e.target.value
              }))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creando...' : 'Crear Evento'}
        </button>
      </form>
    </div>
  );
}