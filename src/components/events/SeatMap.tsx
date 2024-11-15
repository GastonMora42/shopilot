// components/SeatMap.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { ISeat, IEvent } from '@/types';

interface SeatMapProps {
  eventId: string;
  seatingChart: IEvent['seatingChart'];
  onSeatSelect?: (seatId: string) => void;
  occupiedSeats: Array<{
    seatId: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  }>;
}

interface GridSeat {
  id: string;
  displayId: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  price: number;
  section: string;
}

export default function SeatMap({ 
  eventId, 
  seatingChart,
  occupiedSeats,
  onSeatSelect 
}: SeatMapProps) {
  const [gridSeats, setGridSeats] = useState<GridSeat[][]>([]);
  const [loading, setLoading] = useState(true);

  // Crear la grilla de asientos
  const createSeatGrid = useCallback(() => {
    const maxRows = Math.max(...seatingChart.sections.map(s => s.rowEnd));
    const maxCols = Math.max(...seatingChart.sections.map(s => s.columnEnd));
    
    const grid: GridSeat[][] = [];

    for (let row = 1; row <= maxRows; row++) {
      const gridRow: GridSeat[] = [];
      
      for (let col = 1; col <= maxCols; col++) {
        const seatId = `${row}-${col}`;
        
        // Encontrar la sección a la que pertenece este asiento
        const section = seatingChart.sections.find(s => 
          row >= s.rowStart && row <= s.rowEnd &&
          col >= s.columnStart && col <= s.columnEnd
        );

        if (section) {
          // Verificar si está ocupado
          const occupiedSeat = occupiedSeats.find(s => s.seatId === seatId);
          
          gridRow.push({
            id: seatId,
            displayId: `${String.fromCharCode(64 + row)}${col}`,
            type: section.type,
            status: occupiedSeat?.status || 'AVAILABLE',
            price: section.price,
            section: section.name
          });
        } else {
          // Espacio vacío o pasillo
          gridRow.push({
            id: seatId,
            displayId: '',
            type: 'DISABLED',
            status: 'OCCUPIED',
            price: 0,
            section: ''
          });
        }
      }
      
      grid.push(gridRow);
    }

    setGridSeats(grid);
    setLoading(false);
  }, [seatingChart, occupiedSeats]);

  useEffect(() => {
    createSeatGrid();
  }, [createSeatGrid]);

  const handleSeatClick = useCallback((seat: GridSeat) => {
    if (seat.status === 'AVAILABLE' && onSeatSelect) {
      onSeatSelect(seat.id);
    }
  }, [onSeatSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto overflow-x-auto p-4">
      {/* Escenario */}
      <div className="w-full mb-8">
        <div className="bg-gray-800 h-16 rounded-t-[100px] mx-auto max-w-3xl mb-2">
          <div className="text-white text-center pt-4 font-semibold">
            ESCENARIO
          </div>
        </div>
      </div>

      <div className="grid gap-1">
        {gridSeats.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 items-center">
            {/* Letra de fila */}
            <span className="w-8 text-center text-gray-500 font-medium">
              {String.fromCharCode(65 + rowIndex)}
            </span>

            {/* Asientos */}
            <div className="flex flex-1 gap-1 justify-center">
              {row.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  disabled={seat.status !== 'AVAILABLE'}
                  className={`
                    w-8 h-8 text-xs border-2 rounded
                    flex items-center justify-center
                    transition-all duration-200
                    ${getSeatStyle(seat.type, seat.status)}
                  `}
                  title={`${seat.displayId} - ${seat.section} - $${seat.price}`}
                >
                  {seat.displayId.replace(/[A-Z]/, '')}
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
  if (status === 'OCCUPIED') {
    return 'bg-red-100 border-red-300 text-red-500 cursor-not-allowed';
  }
  
  if (status === 'RESERVED') {
    return 'bg-yellow-100 border-yellow-300 text-yellow-600 cursor-not-allowed';
  }

  const baseStyle = 'hover:bg-primary hover:border-primary hover:text-white';
  
  switch (type) {
    case 'VIP':
      return `bg-purple-50 border-purple-300 text-purple-700 ${baseStyle}`;
    case 'DISABLED':
      return 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
    default:
      return `bg-gray-50 border-gray-200 text-gray-700 ${baseStyle}`;
  }
}