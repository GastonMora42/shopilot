// components/tickets/SeatedMap.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '@/types';

interface SeatedMapProps {
  seats: Seat[];
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
  maxSeatsPerPurchase?: number;
}

export const SeatedMap: React.FC<SeatedMapProps> = ({
  seats,
  selectedSeats,
  onSeatClick,
  maxSeatsPerPurchase = 10
}) => {
  const {
    maxRow,
    maxCol,
    seatSize,
    padding,
    viewBox,
    sections
  } = useMemo(() => {
    const maxRow = Math.max(...seats.map(s => s.row));
    const maxCol = Math.max(...seats.map(s => s.column));
    const seatSize = 30;
    const padding = 40;
    
    // Agrupar asientos por sección
    const sections = seats.reduce((acc, seat) => {
      if (!acc[seat.section]) {
        acc[seat.section] = {
          name: seat.section,
          type: seat.type,
          price: seat.price,
          seats: []
        };
      }
      acc[seat.section].seats.push(seat);
      return acc;
    }, {} as Record<string, { name: string; type: Seat['type']; price: number; seats: Seat[] }>);

    return {
      maxRow,
      maxCol,
      seatSize,
      padding,
      sections,
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
    <div className="space-y-6">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white border rounded" />
          <span className="text-sm">Disponible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-sm">Seleccionado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-sm">Ocupado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span className="text-sm">Reservado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-600 rounded" />
          <span className="text-sm">VIP</span>
        </div>
      </div>

      {/* Mapa de asientos */}
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
            const isAvailable = seat.status === 'AVAILABLE';
            const isSelected = selectedSeats.some(s => s._id === seat._id);

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
                    scale: isSelected ? 1.1 : 1
                  }}
                  className={`
                    stroke-gray-300
                    ${isAvailable ? 'cursor-pointer hover:stroke-blue-500' : ''}
                    ${!isAvailable ? 'cursor-not-allowed' : ''}
                  `}
                  onClick={() => {
                    if (isAvailable && 
                        (isSelected || selectedSeats.length < maxSeatsPerPurchase)) {
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

      {/* Resumen de selección */}
      {selectedSeats.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">
            Asientos seleccionados
          </h4>
          <div className="mt-2 space-y-2">
            {Object.values(sections).map(section => {
              const sectionSelectedSeats = selectedSeats.filter(
                seat => seat.section === section.name
              );
              
              if (sectionSelectedSeats.length === 0) return null;

              return (
                <div key={section.name}>
                  <div className="text-sm font-medium">
                    {section.name} - ${section.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Asientos: {sectionSelectedSeats.map(seat => seat.label).join(', ')}
                  </div>
                  <div className="text-sm">
                    Subtotal: ${(section.price * sectionSelectedSeats.length).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};