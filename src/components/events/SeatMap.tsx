// components/SeatMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { ISeat } from '@/types';

interface SeatMapProps {
  eventId: string;
  onSeatSelect?: (seat: ISeat) => void;
}

export default function SeatMap({ eventId, onSeatSelect }: SeatMapProps) {
  const [seats, setSeats] = useState<ISeat[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/seats`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setSeats(data.seats);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [eventId]);

  if (loading) return <div>Cargando mapa de asientos...</div>;

  return (
    <div className="max-w-7xl mx-auto overflow-x-auto p-4">
      {/* Escenario */}
      <div className="w-full mb-8">
        <div className="bg-red-400 h-16 rounded-t-[100px] mx-auto max-w-3xl mb-2">
          <div className="text-white text-center pt-4 font-semibold">
            ESCENARIO
          </div>
        </div>
      </div>

      <div className="grid gap-1">
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 items-center">
            {/* Número de fila */}
            <span className="w-8 text-center text-red-500 font-bold">
              {rowIndex + 1}
            </span>

            {/* Asientos */}
            <div className="flex flex-1 gap-1 justify-center">
              {row.map((seat) => (
                <button
                  key={seat._id.toString()}
                  onClick={() => onSeatSelect?.(seat)}
                  disabled={seat.status !== 'AVAILABLE'}
                  className={`
                    w-7 h-7 text-xs border-2 rounded-sm
                    flex items-center justify-center
                    transition-colors duration-200
                    ${getSeatStyle(seat.type, seat.status)}
                  `}
                  title={`Fila ${rowIndex + 1}, Asiento ${seat.column + 1} - ${seat.type} - $${seat.price}`}
                >
                  {seat.column + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSeatStyle(type: string, status: string): string {
  if (status !== 'AVAILABLE') {
    return 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';
  }
  
  const baseStyle = 'hover:bg-lime-600 hover:border-lime-700 hover:text-white';
  
  switch (type) {
    case 'VIP':
      return `bg-lime-200 border-lime-500 text-lime-700 ${baseStyle}`;
    case 'DISABLED':
      return 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';
    default:
      return `bg-lime-100 border-lime-400 text-lime-600 ${baseStyle}`;
  }
}