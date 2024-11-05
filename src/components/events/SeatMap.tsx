// components/events/SeatMap.tsx
'use client';

import { useState } from 'react';
import { ISeat } from '@/app/models/Seat';

interface SeatMapProps {
  eventId: string;
  rows: number;
  columns: number;
  seats: ISeat[];
  onSeatSelect: (seat: ISeat) => void;
}

export default function SeatMap({ eventId, rows, columns, seats, onSeatSelect }: SeatMapProps) {
  const [selectedSeats, setSelectedSeats] = useState<ISeat[]>([]);

  const handleSeatClick = (seat: ISeat) => {
    if (seat.status !== 'AVAILABLE') return;

    if (selectedSeats.find(s => s.number === seat.number)) {
      setSelectedSeats(prev => prev.filter(s => s.number !== seat.number));
    } else {
      setSelectedSeats(prev => [...prev, seat]);
    }
    onSeatSelect(seat);
  };

  return (
    <div className="grid gap-2 p-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-2 justify-center">
          {Array.from({ length: columns }).map((_, col) => {
            const seat = seats.find(s => s.row === row && s.column === col);
            if (!seat) return null;

            const isSelected = selectedSeats.find(s => s.number === seat.number);
            const isAvailable = seat.status === 'AVAILABLE';

            return (
              <button
                key={`${row}-${col}`}
                onClick={() => handleSeatClick(seat)}
                disabled={!isAvailable}
                className={`
                  w-8 h-8 rounded
                  ${isAvailable ? 'hover:bg-blue-200' : 'cursor-not-allowed'}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${seat.status === 'SOLD' ? 'bg-gray-500' : ''}
                  ${seat.status === 'RESERVED' ? 'bg-yellow-500' : ''}
                  ${seat.type === 'VIP' ? 'border-2 border-gold' : ''}
                `}
              >
                {seat.number}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}