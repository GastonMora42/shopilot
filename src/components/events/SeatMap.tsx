// components/SeatMap.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { IEvent } from '@/types';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MinusIcon, PlusIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/app/lib/utils';

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

const ZoomControls = () => {
  return (
    <div className="flex gap-2 mb-4">
      <Button variant="outline" size="sm" className="p-2">
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="p-2">
        <RotateCcwIcon className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="p-2">
        <PlusIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function SeatMap({ 
  seatingChart,
  occupiedSeats,
  onSeatSelect 
}: SeatMapProps) {
  const [gridSeats, setGridSeats] = useState<GridSeat[][]>([]);
  const [loading, setLoading] = useState(true);

  const createSeatGrid = useCallback(() => {
    // Ajustamos para manejar índices basados en 0
    const maxRows = Math.max(...seatingChart.sections.map(s => s.rowEnd));
    const maxCols = Math.max(...seatingChart.sections.map(s => s.columnEnd));
    
    const grid: GridSeat[][] = [];

    // Ajustamos el loop para empezar desde 0
    for (let row = 0; row < maxRows; row++) {
      const gridRow: GridSeat[] = [];
      
      for (let col = 0; col < maxCols; col++) {
        const seatId = `${row + 1}-${col + 1}`; // Ajustamos el ID para base-1
        
        const section = seatingChart.sections.find(s => 
          row + 1 >= s.rowStart && row + 1 <= s.rowEnd &&
          col + 1 >= s.columnStart && col + 1 <= s.columnEnd
        );

        if (section) {
          const occupiedSeat = occupiedSeats.find(s => s.seatId === seatId);
          
          gridRow.push({
            id: seatId,
            displayId: `${String.fromCharCode(65 + row)}${col + 1}`,
            type: section.type,
            status: occupiedSeat?.status || 'AVAILABLE',
            price: section.price,
            section: section.name
          });
        } else {
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

  function handleSeatClick(seat: GridSeat): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="w-full overflow-x-auto">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="sticky top-0 bg-white z-20 p-4">
              <div className="flex gap-2 justify-center">
                <Button onClick={() => zoomOut()}>-</Button>
                <Button onClick={() => resetTransform()}>Reset</Button>
                <Button onClick={() => zoomIn()}>+</Button>
              </div>
            </div>
            <TransformComponent
              wrapperClass="!w-full"
              contentClass="!w-full"
            >
              <div className="min-w-max p-4">
                {/* Escenario */}
                <div className="w-full mb-8">
                  <div className="bg-gray-800 h-16 rounded-t-[100px] mx-auto max-w-3xl mb-2">
                    <div className="text-white text-center pt-4 font-semibold">
                      ESCENARIO
                    </div>
                  </div>
                </div>

                {/* Grid de asientos */}
                <div className="relative">
                  {/* Header con números de columna */}
                  <div className="flex pl-12 mb-2 sticky top-0 bg-white z-10">
                    {Array.from({ length: gridSeats[0]?.length || 0 }).map((_, idx) => (
                      <div key={idx} className="w-10 flex-shrink-0 text-center text-xs text-gray-500">
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {/* Filas de asientos */}
                  <div className="grid gap-1">
                    {gridSeats.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex items-center gap-1">
                        {/* Letra de fila */}
                        <div className="w-12 flex-shrink-0 text-center text-sm font-medium text-gray-600">
                          {String.fromCharCode(65 + rowIndex)}
                        </div>

                        {/* Asientos */}
                        <div className="flex gap-1">
                          {row.map((seat) => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={seat.status !== 'AVAILABLE'}
                              className={cn(
                                "w-10 h-10 rounded-md border-2",
                                "flex items-center justify-center",
                                "text-xs font-medium",
                                "transition-all duration-200",
                                "relative group flex-shrink-0",
                                getSeatStyle(seat.type, seat.status)
                              )}
                            >
                              {seat.displayId.replace(/[A-Z]/, '')}
                              
                              {/* Tooltip */}
                              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 text-white text-xs rounded whitespace-nowrap z-20">
                                <div>Asiento: {seat.displayId}</div>
                                <div>Sección: {seat.section}</div>
                                <div>Precio: ${seat.price}</div>
                                <div>Estado: {getStatusText(seat.status)}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
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

  const baseStyle = 'hover:bg-primary hover:border-primary hover:text-white hover:scale-110';
  
  switch (type) {
    case 'VIP':
      return `bg-purple-50 border-purple-300 text-purple-700 ${baseStyle}`;
    case 'DISABLED':
      return 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
    default:
      return `bg-gray-50 border-gray-200 text-gray-700 ${baseStyle}`;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'OCCUPIED':
      return 'Ocupado';
    case 'RESERVED':
      return 'Reservado';
    default:
      return status;
  }
}