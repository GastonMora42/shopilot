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
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/seats`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        
        setSeats(data.seats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [eventId]);

  if (loading) return <div>Cargando mapa de asientos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1 p-4">
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            <span className="w-6 text-center">
              {String.fromCharCode(65 + rowIndex)}
            </span>
            {row.map((seat) => (
              <button
                key={seat._id.toString()}
                onClick={() => onSeatSelect?.(seat)}
                disabled={seat.status !== 'AVAILABLE'}
                className={`
                  w-8 h-8 rounded 
                  ${getSeatStyle(seat.type, seat.status)}
                `}
                title={`${seat.number} - ${seat.type} - $${seat.price}`}
              >
                {seat.column + 1}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSeatStyle(type: string, status: string): string {
  if (status !== 'AVAILABLE') {
    return 'bg-gray-300 cursor-not-allowed';
  }
  
  switch (type) {
    case 'VIP':
      return 'bg-purple-500 hover:bg-purple-600 text-white';
    case 'DISABLED':
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    default:
      return 'bg-green-500 hover:bg-green-600 text-white';
  }
}