// components/SeatSelector.tsx
'use client';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection, ISeat } from '@/types';
import { useEffect } from 'react';

type SeatStatus = ISeat['status'];

// Definimos las constantes de estado basadas en tu interfaz ISeat
const SEAT_STATUS: Record<string, SeatStatus> = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED'
} as const;

interface SeatProps {
  seatId: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  isSelected: boolean;
  isOccupied: boolean;
  price: number;
  onClick: (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => void;
}

const Seat = ({ 
  seatId, 
  type,
  isSelected, 
  isOccupied,
  price, 
  onClick 
}: SeatProps) => (
  <button
    onClick={() => onClick(seatId, type)}
    disabled={type === 'DISABLED' || isOccupied}
    className={cn(
      "relative w-9 h-9 md:w-12 md:h-12 rounded-md border-2 transition-all text-sm md:text-base",
      isSelected && "bg-primary text-white border-primary ring-2 ring-primary ring-offset-2",
      isOccupied && "bg-red-100 border-red-300 text-red-500 cursor-not-allowed",
      type === 'VIP' && !isSelected && !isOccupied && "bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700",
      type === 'REGULAR' && !isSelected && !isOccupied && "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700",
      type === 'DISABLED' && "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed",
      "flex items-center justify-center group"
    )}
  >
    {seatId}
    <span className={cn(
      "absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs",
      "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
      "whitespace-nowrap z-10"
    )}>
      {isOccupied ? 'Ocupado' : `$${price}`}
    </span>
  </button>
);

interface SeatSelectorProps {
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: Array<{
    seatId: string;
    status: ISeat['status'];
  }>;
  onSeatSelect: (seats: string[]) => Promise<void>;
}

export function SeatSelector({ 
  seatingChart, 
  selectedSeats, 
  occupiedSeats, 
  onSeatSelect 
}: SeatSelectorProps) {
  const getSectionForSeat = (row: number, col: number): ISection | undefined => {
    return seatingChart.sections.find(section =>
      row >= section.rowStart &&
      row <= section.rowEnd &&
      col >= section.columnStart &&
      col <= section.columnEnd
    );
  };

  useEffect(() => {
    console.log('SeatSelector received new occupiedSeats:', occupiedSeats);
  }, [occupiedSeats]);

  const isSeatOccupied = (seatId: string): boolean => {
    console.log('Checking seat:', seatId, 'Current occupied seats:', occupiedSeats);
    return occupiedSeats.some(seat => {
      const isOccupied = seat.seatId === seatId && 
        [SEAT_STATUS.OCCUPIED, SEAT_STATUS.RESERVED].includes(seat.status);
      console.log(`Seat ${seatId} status:`, seat.status, 'Is occupied:', isOccupied);
      return isOccupied;
    });
  };

  const handleSeatClick = async (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => {
    if (type === 'DISABLED') return;
    if (isSeatOccupied(seatId)) return;
    
    const newSelectedSeats = selectedSeats.includes(seatId)
      ? selectedSeats.filter(id => id !== seatId)
      : [...selectedSeats, seatId];

    await onSeatSelect(newSelectedSeats);
  };


  return (
    <div className="space-y-6 max-w-full overflow-x-auto pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded" />
            <span className="text-sm">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded" />
            <span className="text-sm">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
            <span className="text-sm">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded" />
            <span className="text-sm">No disponible</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-max">
          <div className="grid gap-2 md:gap-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="grid gap-1 place-items-center mb-4">
              <div className="w-32 h-2 bg-gray-300 rounded-lg" />
              <span className="text-sm text-gray-500">ESCENARIO</span>
            </div>
            
            {Array.from({ length: seatingChart.rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 items-center">
                <span className="w-6 text-center text-sm font-medium text-gray-600">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
                <div className="flex gap-1 md:gap-2">
                  {Array.from({ length: seatingChart.columns }).map((_, colIndex) => {
                    const section = getSectionForSeat(rowIndex, colIndex);
                    if (!section) return null;

                    const seatId = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
                    const isOccupied = isSeatOccupied(seatId);
                    
                    console.log(`Rendering seat ${seatId}:`, {
                      isOccupied,
                      section: section.type,
                      occupiedStatus: occupiedSeats.find(s => s.seatId === seatId)?.status
                    });

                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        type={section.type}
                        isSelected={selectedSeats.includes(seatId)}
                        isOccupied={isOccupied}
                        price={section.price}
                        onClick={handleSeatClick}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 justify-between items-center bg-gray-50 p-3 rounded-lg">
        <Badge variant="outline" className="text-sm">
          Asientos seleccionados: {selectedSeats.length}
        </Badge>
        {selectedSeats.length > 0 && (
          <div className="text-sm text-gray-600">
            {selectedSeats.sort().join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}