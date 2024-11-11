// components/SeatSelector.tsx
'use client';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection, ISeat } from '@/types';
import { useMemo } from 'react';

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
      "relative w-8 h-8 md:w-10 md:h-10 rounded-md border-2 transition-all text-sm md:text-base",
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
      "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs",
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

  const isSeatOccupied = (seatId: string): boolean => {
    return occupiedSeats.some(seat => {
      const isOccupied = seat.seatId === seatId &&
        [SEAT_STATUS.OCCUPIED, SEAT_STATUS.RESERVED].includes(seat.status);
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

  const seatGrid = useMemo(() => {
    return (
      <div className="grid gap-1 md:gap-2" style={{
        gridTemplateColumns: `repeat(${seatingChart.columns}, minmax(0, 1fr))`
      }}>
        {Array.from({ length: seatingChart.rows * seatingChart.columns }).map((_, index) => {
          const row = Math.floor(index / seatingChart.columns);
          const col = index % seatingChart.columns;
          const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;

          const section = getSectionForSeat(row, col);
          if (!section) return null;

          const isOccupied = isSeatOccupied(seatId);

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
    );
  }, [seatingChart, selectedSeats, occupiedSeats]);

  return (
    <div className="space-y-6 max-w-full overflow-x-auto pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex flex-wrap gap-3">
          {/* Leyenda de estados de asientos */}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {seatGrid}
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