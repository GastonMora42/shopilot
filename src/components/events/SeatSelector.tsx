// components/SeatSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection  } from '@/types';

type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface SeatProps {
  seatId: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  isSelected: boolean;
  isOccupied: boolean;
  isReserved: boolean;
  price: number;
  onClick: (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => void; // Corregido aquí
}

// components/SeatSelector.tsx
interface SeatSelectorProps {
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: Array<{
    seatId: string;
    status: SeatStatus;
  }>;
  onSeatSelect: (seats: string[]) => Promise<void>;
  reservationTimeout?: number | null; // Agregado como opcional
  maxSeats?: number;
}

const Seat = ({
  seatId,
  type,
  isSelected,
  isOccupied,
  isReserved,
  price,
  onClick
}: SeatProps) => {
  const [row, col] = seatId.split('-');
  const letterFormatId = `${String.fromCharCode(64 + parseInt(row))}${col}`;

  return (
    <motion.button
      onClick={() => onClick(letterFormatId, type)}
      disabled={type === 'DISABLED' || isOccupied || isReserved}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative w-12 h-12 md:w-14 md:h-14 rounded-md border-2 transition-all text-sm md:text-base",
        isSelected && "bg-primary text-white border-primary ring-2 ring-primary ring-offset-2",
        isOccupied && "bg-red-100 border-red-300 text-red-500 cursor-not-allowed",
        isReserved && "bg-yellow-100 border-yellow-300 text-yellow-600 cursor-not-allowed",
        type === 'VIP' && !isSelected && !isOccupied && !isReserved && "bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700",
        type === 'REGULAR' && !isSelected && !isOccupied && !isReserved && "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700",
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
        {isOccupied ? 'Ocupado' : isReserved ? 'Reservado' : `$${price}`}
      </span>
    </motion.button>
  );
};

interface SeatSelectorProps {
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: Array<{
    seatId: string;
    status: SeatStatus;
  }>;
  onSeatSelect: (seats: string[]) => Promise<void>;
  maxSeats?: number;
}

export function SeatSelector({
  seatingChart,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  maxSeats = 6
}: SeatSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ISection | null>(null);

  const isSeatOccupied = (seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === 'OCCUPIED'
    );
  };

  const isSeatReserved = (seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === 'RESERVED'
    );
  };

  const handleSeatClick = async (letterId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => {
    if (type === 'DISABLED') return;
    
    const [letter, col] = letterId.split('');
    const numericId = `${letter.charCodeAt(0) - 64}-${col}`;
  
    const isCurrentlySelected = selectedSeats.includes(numericId);
    
    if (!isCurrentlySelected && selectedSeats.length >= maxSeats) {
      return;
    }
  
    const newSelectedSeats = isCurrentlySelected
      ? selectedSeats.filter(id => id !== numericId)
      : [...selectedSeats, numericId];
  
    await onSeatSelect(newSelectedSeats);
  };

  const handleSectionSelect = (section: ISection) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  const seatGrid = useMemo(() => {
    if (selectedSection) {
      return (
        <div className="grid gap-4 md:gap-6" style={{
          gridTemplateColumns: `repeat(${selectedSection.columnEnd - selectedSection.columnStart + 1}, minmax(0, 1fr))`
        }}>
          {Array.from({ length: selectedSection.rowEnd - selectedSection.rowStart + 1 }).map((_, rowIndex) => {
            const actualRow = rowIndex + selectedSection.rowStart + 1;
            return (
              <div key={actualRow} className="flex gap-4 items-center">
                <span className="w-10 text-center text-sm font-medium text-gray-600">
                  {actualRow}
                </span>
                <div className="flex gap-4 md:gap-6">
                  {Array.from({ length: selectedSection.columnEnd - selectedSection.columnStart + 1 }).map((_, colIndex) => {
                    const actualCol = colIndex + selectedSection.columnStart + 1;
                    const seatId = `${actualRow}-${actualCol}`;
                    
                    return (
                      <Seat
                      key={seatId}
                      seatId={seatId}
                      type={selectedSection.type as 'REGULAR' | 'VIP' | 'DISABLED'} // Asegurar el tipo correcto
                      isSelected={selectedSeats.includes(seatId)}
                      isOccupied={isSeatOccupied(seatId)}
                      isReserved={isSeatReserved(seatId)}
                      price={selectedSection.price}
                      onClick={(seatId, type) => handleSeatClick(seatId, type)}
                    />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seatingChart.sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-lg shadow-sm transition-all hover:scale-105 cursor-pointer",
              section.type === 'VIP' && "bg-purple-50 border-purple-300",
              section.type === 'REGULAR' && "bg-gray-50 border-gray-200",
              section.type === 'DISABLED' && "bg-gray-100 border-gray-200 cursor-not-allowed"
            )}
            onClick={() => handleSectionSelect(section)}
          >
            <h3 className="text-lg font-semibold">{section.name}</h3>
            <p className="text-gray-600 text-sm">
              Disponibles: {section.rowEnd - section.rowStart + 1} filas, 
              {section.columnEnd - section.columnStart + 1} columnas
            </p>
            <p className="text-gray-900 font-medium">Precio: ${section.price}</p>
          </motion.div>
        ))}
      </div>
    );
  }, [seatingChart, selectedSeats, occupiedSeats, selectedSection]);

  return (
    <div className="space-y-6 max-w-full overflow-x-auto pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            Ver Mapa de Asientos
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setSelectedSection(null);
      }}>
        <ModalHeader>
          <h3 className="text-xl font-semibold">
            {selectedSection ? selectedSection.name : 'Mapa de Asientos'}
          </h3>
          <Button variant="outline" size="sm" onClick={() => {
            setIsModalOpen(false);
            setSelectedSection(null);
          }}>
            Cerrar
          </Button>
        </ModalHeader>
        <ModalContent>
          <div className="overflow-auto max-h-[80vh]">
            {seatGrid}
          </div>
        </ModalContent>
        <ModalFooter>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded" />
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
              <span className="text-sm">Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded" />
              <span className="text-sm">Reservado</span>
            </div>
          </div>
        </ModalFooter>
      </Modal>

      <div className="flex flex-col md:flex-row gap-2 justify-between items-center bg-gray-50 p-3 rounded-lg">
        <Badge variant="outline" className="text-sm">
          Asientos seleccionados: {selectedSeats.length} / {maxSeats}
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