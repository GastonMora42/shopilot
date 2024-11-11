// components/SeatSelector.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection, ISeat } from '@/types';
import { useState, useMemo } from 'react';

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
      "relative w-10 h-10 md:w-12 md:h-12 rounded-md border-2 transition-all text-sm md:text-base",
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ISection | null>(null);

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

  const handleSectionSelect = (section: ISection) => {
    setSelectedSection(section);
    setIsExpanded(true);
  };

  const seatGrid = useMemo(() => {
    if (selectedSection) {
      return (
        <div className="grid gap-2 md:gap-4" style={{
          gridTemplateColumns: `repeat(${selectedSection.columnEnd - selectedSection.columnStart + 1}, minmax(0, 1fr))`
        }}>
          {Array.from({ length: selectedSection.rowEnd - selectedSection.rowStart + 1 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 items-center">
              <span className="w-8 text-center text-sm font-medium text-gray-600">
                {String.fromCharCode(65 + selectedSection.rowStart + rowIndex)}
              </span>
              <div className="flex gap-2 md:gap-4">
                {Array.from({ length: selectedSection.columnEnd - selectedSection.columnStart + 1 }).map((_, colIndex) => {
                  const row = selectedSection.rowStart + rowIndex;
                  const col = selectedSection.columnStart + colIndex;
                  const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;

                  const isOccupied = isSeatOccupied(seatId);

                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      type={selectedSection.type}
                      isSelected={selectedSeats.includes(seatId)}
                      isOccupied={isOccupied}
                      price={selectedSection.price}
                      onClick={handleSeatClick}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="grid gap-2 md:gap-4" style={{
          gridTemplateColumns: `repeat(5, minmax(0, 1fr))`
        }}>
          {seatingChart.sections.map((section, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg shadow-sm transition-all hover:scale-105 cursor-pointer",
                section.type === 'VIP' && "bg-purple-50 border-purple-300",
                section.type === 'REGULAR' && "bg-gray-50 border-gray-200",
                section.type === 'DISABLED' && "bg-gray-100 border-gray-200 cursor-not-allowed"
              )}
              onClick={() => handleSectionSelect(section)}
            >
              <h3 className="text-lg font-semibold">{section.name}</h3>
              <p className="text-gray-600 text-sm">Disponibles: {section.rowEnd - section.rowStart + 1} filas, {section.columnEnd - section.columnStart + 1} columnas</p>
              <p className="text-gray-900 font-medium">Precio: ${section.price}</p>
            </div>
          ))}
        </div>
      );
    }
  }, [seatingChart, selectedSeats, occupiedSeats, selectedSection]);

  return (
    <div className="space-y-6 max-w-full overflow-x-auto pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex items-center gap-3">
          {/* Leyenda de estados de asientos */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} Mapa de Asientos
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="w-full overflow-x-auto">
          {seatGrid}
        </div>
      )}

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