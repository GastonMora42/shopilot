// components/SeatSelector.tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/app/lib/utils';

interface SeatProps {
  seatId: string;
  isSelected: boolean;
  isVIP?: boolean;
  isDisabled?: boolean;
  price: number;
  onClick: (id: string) => void;
}

const Seat = ({ seatId, isSelected, isVIP, isDisabled, price, onClick }: SeatProps) => (
  <button
    onClick={() => onClick(seatId)}
    disabled={isDisabled}
    className={cn(
      "w-12 h-12 rounded-md border transition-all",
      isSelected && "bg-primary text-white border-primary",
      isVIP && !isSelected && "bg-purple-100 hover:bg-purple-200 border-purple-300",
      !isVIP && !isSelected && "bg-gray-50 hover:bg-gray-100",
      isDisabled && "bg-gray-200 cursor-not-allowed",
      "flex items-center justify-center relative group"
    )}
  >
    {seatId}
    <span className="absolute -top-8 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-xs py-1 px-2 rounded">
      ${price}
    </span>
  </button>
);

interface SeatSelectorProps {
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      type: string;
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
  };
  selectedSeats: string[];
  onSeatSelect: (seats: string[]) => void;
}

export function SeatSelector({ seatingChart, selectedSeats, onSeatSelect }: SeatSelectorProps) {
  const getSectionForSeat = (row: number, col: number) => {
    return seatingChart.sections.find(section =>
      row >= section.rowStart &&
      row <= section.rowEnd &&
      col >= section.columnStart &&
      col <= section.columnEnd
    );
  };

  const handleSeatClick = (seatId: string, section: any) => {
    if (selectedSeats.includes(seatId)) {
      onSeatSelect(selectedSeats.filter(id => id !== seatId));
    } else {
      onSeatSelect([...selectedSeats, seatId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border rounded" />
            <span className="text-sm">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
            <span className="text-sm">VIP</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: seatingChart.rows }).map((_, row) => (
          <div key={row} className="flex gap-2 justify-center">
            <span className="w-8 text-center text-sm font-medium">
              {String.fromCharCode(65 + row)}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: seatingChart.columns }).map((_, col) => {
                const section = getSectionForSeat(row, col);
                const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
                
                return section ? (
                  <Seat
                    key={seatId}
                    seatId={seatId}
                    isSelected={selectedSeats.includes(seatId)}
                    isVIP={section.type === 'VIP'}
                    isDisabled={section.type === 'DISABLED'}
                    price={section.price}
                    onClick={() => handleSeatClick(seatId, section)}
                  />
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <Badge variant="outline">
          Asientos seleccionados: {selectedSeats.length}
        </Badge>
      </div>
    </div>
  );
}