// components/events/SeatMap.tsx

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '@/types';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
  mode?: 'display' | 'edit';
  onSeatCreate?: (seat: Partial<Seat>) => void;
  onSeatDelete?: (seatId: string) => void;
  sections?: Array<{
    id: string;
    name: string;
    type: 'REGULAR' | 'VIP' | 'DISABLED';
    price: number;
    color: string;
  }>;
  selectedSection?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onSeatClick,
  mode = 'display',
  onSeatCreate,
  onSeatDelete,
  sections = [],
  selectedSection
}) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const {
    maxRow,
    maxCol,
    seatSize,
    padding,
    viewBox,
    grid
  } = useMemo(() => {
    // Ya no limitamos artificialmente, usamos el máximo real
    const maxRow = Math.max(...seats.map(s => s.row), 1);
    const maxCol = Math.max(...seats.map(s => s.column), 1);  
      // Ajustamos el tamaño del asiento según el número de columnas
  const baseSeatSize = 30;
  const adjustedSeatSize = maxCol > 20 ? 
    Math.min(baseSeatSize, Math.floor(800 / maxCol)) : 
    baseSeatSize;
  const padding = 40;
  const grid = mode === 'edit' ? Array.from({ length: maxRow * maxCol }) : [];
  
  return {
    maxRow,
    maxCol,
    seatSize: adjustedSeatSize,
    padding,
    viewBox: `0 0 ${(maxCol * adjustedSeatSize) + (padding * 2)} ${(maxRow * adjustedSeatSize) + (padding * 2)}`,
    grid
  };
}, [seats, mode]);

  const getSeatColor = (seat: Seat) => {
    if (mode === 'edit') {
      const section = sections.find(s => s.id === seat.section);
      return section?.color || 'rgb(255, 255, 255)';
    }

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

  const handleGridClick = (row: number, col: number) => {
    if (mode !== 'edit' || !onSeatCreate || !selectedSection) return;

    const existingSeat = seats.find(s => s.row === row && s.column === col);
    if (existingSeat) {
      onSeatDelete?.(existingSeat._id);
    } else {
      const section = sections.find(s => s.id === selectedSection);
      if (!section) return;

      onSeatCreate({
        row,
        column: col,
        label: `${String.fromCharCode(65 + row)}${col + 1}`,
        status: 'AVAILABLE',
        type: section.type,
        section: section.id,
        price: section.price
      });
    }
  };

  return (
    <div className="relative w-full overflow-auto bg-gray-100 rounded-lg">
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ minHeight: '400px' }}
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
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

        {/* Grid en modo edición */}
        {mode === 'edit' && grid.map((_, index) => {
          const row = Math.floor(index / maxCol);
          const col = index % maxCol;
          const x = padding + (col * seatSize);
          const y = padding + (row * seatSize);

          return (
            <rect
              key={`grid-${row}-${col}`}
              x={x}
              y={y}
              width={25}
              height={25}
              rx={4}
              className="fill-transparent stroke-gray-200 stroke-dashed cursor-pointer hover:stroke-gray-400"
              onClick={() => handleGridClick(row, col)}
            />
          );
        })}

        {/* Asientos */}
        {seats.map((seat) => {
          const x = padding + ((seat.column - 1) * seatSize);
          const y = padding + ((seat.row - 1) * seatSize);

          return (
            <g key={seat._id}>
<motion.rect
  x={x}
  y={y}
  width={seatSize * 0.833} // Ajustamos el tamaño del asiento proporcionalmente
  height={seatSize * 0.833}
  rx={4}
                initial={false}
                animate={{
                  fill: getSeatColor(seat),
                  scale: selectedSeats.some(s => s._id === seat._id) ? 1.1 : 1
                }}
                className={`
                  stroke-gray-300
                  ${mode === 'edit' ? 'cursor-pointer' : ''}
                  ${mode === 'display' && seat.status === 'AVAILABLE' ? 'cursor-pointer hover:stroke-blue-500' : ''}
                  ${mode === 'display' && seat.status !== 'AVAILABLE' ? 'cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (mode === 'edit') {
                    handleGridClick(seat.row, seat.column);
                  } else if (seat.status === 'AVAILABLE') {
                    onSeatClick(seat);
                  }
                }}
              />
<text
  x={x + (seatSize * 0.416)} // Ajustamos la posición del texto
  y={y + (seatSize * 0.533)}
  textAnchor="middle"
  className={`text-[8px] fill-gray-700 pointer-events-none ${
    seatSize < 25 ? 'text-[6px]' : 'text-[8px]' // Ajustamos el tamaño del texto
  }`}
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