// components/events/SeatSelector/SeatMap.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '@/types';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onSeatClick
}) => {
  const {
    maxRow,
    maxCol,
    seatSize,
    padding,
    viewBox
  } = useMemo(() => {
    const maxRow = Math.max(...seats.map(s => s.row));
    const maxCol = Math.max(...seats.map(s => s.column));
    const seatSize = 30;
    const padding = 40;
    
    return {
      maxRow,
      maxCol,
      seatSize,
      padding,
      viewBox: `0 0 ${(maxCol * seatSize) + (padding * 2)} ${(maxRow * seatSize) + (padding * 2)}`
    };
  }, [seats]);

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.some(s => s._id === seat._id)) {
      return 'rgb(59, 130, 246)'; // blue-500
    }
    switch (seat.status) {
      case 'OCCUPIED':
        return 'rgb(239, 68, 68)'; // red-500
      case 'RESERVED':
        return 'rgb(234, 179, 8)'; // yellow-500
      default:
        switch (seat.type) {
          case 'VIP':
            return 'rgb(147, 51, 234)'; // purple-600
          case 'DISABLED':
            return 'rgb(107, 114, 128)'; // gray-500
          default:
            return 'rgb(255, 255, 255)'; // white
        }
    }
  };

  return (
    <div className="relative w-full overflow-auto bg-gray-100 rounded-lg">
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ minHeight: '400px' }}
      >
        {/* Escenario */}
        <rect
          x={padding}
          y={10}
          width={(maxCol * seatSize)}
          height={20}
          rx={5}
          className="fill-gray-300"
        />
        <text
          x={padding + ((maxCol * seatSize) / 2)}
          y={25}
          textAnchor="middle"
          className="text-xs fill-gray-700"
        >
          ESCENARIO
        </text>

        {/* Asientos */}
        {seats.map((seat) => {
          const x = padding + ((seat.column - 1) * seatSize);
          const y = padding + ((seat.row - 1) * seatSize);

          return (
            <g key={seat._id}>
              <motion.rect
                x={x}
                y={y}
                width={25}
                height={25}
                rx={4}
                initial={false}
                animate={{
                  fill: getSeatColor(seat),
                  scale: selectedSeats.some(s => s._id === seat._id) ? 1.1 : 1
                }}
                className={`
                  stroke-gray-300
                  ${seat.status === 'AVAILABLE' ? 'cursor-pointer hover:stroke-blue-500' : ''}
                  ${seat.status === 'RESERVED' ? 'cursor-not-allowed' : ''}
                  ${seat.status === 'OCCUPIED' ? 'cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (seat.status === 'AVAILABLE') {
                    onSeatClick(seat);
                  }
                }}
              />
              <text
                x={x + 12.5}
                y={y + 16}
                textAnchor="middle"
                className="text-[8px] fill-gray-700 pointer-events-none"
              >
                {seat.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

