// components/SeatSelector.tsx
'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection } from '@/types';
import { CountdownTimer } from './CountdownTimer';

type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface SeatProps {
  seatId: string;
  displayId: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  isSelected: boolean;
  isOccupied: boolean;
  isReserved: boolean;
  price: number;
  onClick: (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => void;
}

interface SeatSelectorProps {
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: Array<{
    seatId: string;
    status: SeatStatus;
  }>;
  onSeatSelect: (seats: string[]) => Promise<void>;
  reservationTimeout?: number | null;
  maxSeats?: number;
}

const Seat = ({
  seatId,
  displayId,
  type,
  isSelected,
  isOccupied,
  isReserved,
  price,
  onClick
}: SeatProps) => (
  <motion.button
    onClick={() => onClick(seatId, type)}
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
    {displayId}
    <span className={cn(
      "absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs",
      "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
      "whitespace-nowrap z-10"
    )}>
      {isOccupied ? 'Ocupado' : isReserved ? 'Reservado' : `$${price}`}
    </span>
  </motion.button>
);
export function SeatSelector({
  seatingChart,
  reservationTimeout,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  maxSeats = 6
}: SeatSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedSection] = useState<ISection | null>(null);
  const isSeatOccupied = useCallback((seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === 'OCCUPIED'
    );
  }, [occupiedSeats]);

  const isSeatReserved = useCallback((seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === 'RESERVED'
    );
  }, [occupiedSeats]);

  const handleSeatClick = async (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => {
    try {
        if (type === 'DISABLED') return;

        // Verificar si el asiento está ocupado o reservado
        const isCurrentlyOccupied = isSeatOccupied(seatId);
        const isCurrentlyReserved = isSeatReserved(seatId);

        if (isCurrentlyOccupied || isCurrentlyReserved) {
            alert("Este asiento no está disponible. Selecciona otro asiento.");
            return;
        }

        const isCurrentlySelected = selectedSeats.includes(seatId);

        if (!isCurrentlySelected && selectedSeats.length >= maxSeats) {
            alert(`No puedes seleccionar más de ${maxSeats} asientos`);
            return;
        }

        const newSelectedSeats = isCurrentlySelected
            ? selectedSeats.filter(id => id !== seatId)
            : [...selectedSeats, seatId];

        console.log('New selection:', newSelectedSeats);
        await onSeatSelect(newSelectedSeats);
    } catch (error) {
        console.error('Error al seleccionar asiento:', error);
    }
};


  const renderSectionGrid = (section: ISection) => {
    const rows = section.rowEnd - section.rowStart + 1;
    const cols = section.columnEnd - section.columnStart + 1;

    return (
      <div className="flex flex-col gap-2">
        {/* Header con números de columna */}
        <div className="flex pl-10">
          {Array.from({ length: cols }).map((_, idx) => (
            <div key={idx} className="w-14 text-center text-xs text-gray-500">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Grid de asientos */}
        <div className="grid gap-2">
          {Array.from({ length: rows }).map((_, rowIdx) => {
            const actualRow = section.rowStart + rowIdx;
            return (
              <div key={rowIdx} className="flex items-center">
                {/* Letra de fila */}
                <div className="w-10 text-center text-sm font-medium text-gray-600">
                  {String.fromCharCode(65 + rowIdx)}
                </div>
                {/* Asientos de la fila */}
                <div className="flex gap-2">
                  {Array.from({ length: cols }).map((_, colIdx) => {
                    const actualCol = section.columnStart + colIdx;
                    // Este es el ID que usaremos para la base de datos
                    const seatId = `${actualRow}-${actualCol}`;
                    // Este es el ID que mostraremos al usuario
                    const displayId = `${String.fromCharCode(65 + rowIdx)}${colIdx + 1}`;

                    console.log('Rendering seat:', { seatId, displayId });

                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId} // Formato DB
                        displayId={displayId} // Formato visual
                        type={section.type}
                        isSelected={selectedSeats.includes(seatId)}
                        isOccupied={isSeatOccupied(seatId)}
                        isReserved={isSeatReserved(seatId)}
                        price={section.price}
                        onClick={handleSeatClick}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-auto pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
        >
          Ver Mapa de Asientos
        </Button>
        <AnimatePresence>
        {reservationTimeout && reservationTimeout > Date.now() && (
          <CountdownTimer expiresAt={reservationTimeout} />
        )}
      </AnimatePresence>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSection(null);
        }}
      >
        <ModalHeader>
          <h3 className="text-xl font-semibold">Mapa de Asientos</h3>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-8 max-h-[70vh] overflow-auto p-4">
            {seatingChart.sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium">{section.name}</h4>
                  <span className="text-sm text-gray-600">${section.price}</span>
                </div>
                {renderSectionGrid(section)}
              </div>
            ))}
          </div>
        </ModalContent>
        <ModalFooter>
          <div className="flex flex-wrap gap-4 justify-between w-full">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded" />
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary border-2 border-primary rounded" />
                <span className="text-sm">Seleccionado</span>
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
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
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