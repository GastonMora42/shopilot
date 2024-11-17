// components/events/SeatSelector/SeatLegend.tsx
import React from 'react';

export const SeatLegend: React.FC = () => {
  const legendItems = [
    { color: 'bg-white', text: 'Disponible' },
    { color: 'bg-blue-500', text: 'Seleccionado' },
    { color: 'bg-yellow-500', text: 'Reservado' },
    { color: 'bg-red-500', text: 'Ocupado' },
    { color: 'bg-purple-600', text: 'VIP' },
    { color: 'bg-gray-500', text: 'Accesibilidad' }
  ];

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Referencias</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {legendItems.map(({ color, text }) => (
          <div key={text} className="flex items-center space-x-2">
            <div
              className={`w-5 h-5 rounded border border-gray-300 ${color}`}
            />
            <span className="text-sm text-gray-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

