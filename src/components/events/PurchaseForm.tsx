// components/events/PurchaseForm.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PurchaseForm({ event }: { event: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    dni: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          buyerInfo,
          price: event.price
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar la compra');
      }

      const { initPoint } = await response.json();
      
      // Redirigir a MercadoPago
      window.location.href = initPoint;
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la compra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">Comprar Entrada</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={buyerInfo.name}
            onChange={(e) => setBuyerInfo(prev => ({
              ...prev,
              name: e.target.value
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded"
            value={buyerInfo.email}
            onChange={(e) => setBuyerInfo(prev => ({
              ...prev,
              email: e.target.value
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            DNI
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={buyerInfo.dni}
            onChange={(e) => setBuyerInfo(prev => ({
              ...prev,
              dni: e.target.value
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            className="w-full p-2 border rounded"
            value={buyerInfo.phone}
            onChange={(e) => setBuyerInfo(prev => ({
              ...prev,
              phone: e.target.value
            }))}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Procesando...' : 'Comprar Entrada'}
        </button>
      </form>
    </div>
  );
};
