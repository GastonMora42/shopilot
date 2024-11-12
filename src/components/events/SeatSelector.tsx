// components/SeatSelector.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection, ISeat } from '@/types';
import { Toast } from '@/components/ui/Toast';

type SeatStatus = ISeat['status'];

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
  isReserved: boolean;
  price: number;
  onClick: (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => void;
}

const Seat = ({
  seatId,
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
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
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
    <motion.span 
      className={cn(
        "absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 text-white text-xs",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "whitespace-nowrap z-10"
      )}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {isOccupied ? 'Ocupado' : 
       isReserved ? 'Reservado' : 
       `$${price}`}
    </motion.span>
  </motion.button>
);

interface SeatSelectorProps {
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: Array<{
    seatId: string;
    status: ISeat['status'];
  }>;
  onSeatSelect: (seats: string[]) => Promise<void>;
  reservationTimeout?: number | null;
  maxSeats?: number;
}

export function SeatSelector({
  seatingChart,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  reservationTimeout,
  maxSeats = 6
}: SeatSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ISection | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (reservationTimeout) {
      const updateTimer = () => {
        const remaining = new Date(reservationTimeout).getTime() - Date.now();
        setTimeRemaining(remaining > 0 ? remaining : null);
        
        // Mostrar advertencia cuando queden 2 minutos
        if (remaining > 0 && remaining <= 120000 && remaining > 119000) {
          showNotification('¡Quedan 2 minutos para completar tu compra!');
        }
      };

      const timer = setInterval(updateTimer, 1000);
      updateTimer();

      return () => clearInterval(timer);
    }
  }, [reservationTimeout]);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const isSeatOccupied = (seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === SEAT_STATUS.OCCUPIED
    );
  };

  const isSeatReserved = (seatId: string): boolean => {
    return occupiedSeats.some(seat => 
      seat.seatId === seatId && seat.status === SEAT_STATUS.RESERVED
    );
  };

  const handleSeatClick = async (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => {
    if (type === 'DISABLED') return;
    
    const isCurrentlySelected = selectedSeats.includes(seatId);
    
    if (!isCurrentlySelected && selectedSeats.length >= maxSeats) {
      showNotification(`No puedes seleccionar más de ${maxSeats} asientos`);
      return;
    }

    const newSelectedSeats = isCurrentlySelected
      ? selectedSeats.filter(id => id !== seatId)
      : [...selectedSeats, seatId];

    try {
      await onSeatSelect(newSelectedSeats);
    } catch (error) {
      showNotification('Error al seleccionar el asiento. Por favor, intenta de nuevo.');
    }
  };

  const seatGrid = useMemo(() => {
    if (selectedSection) {
      return (
        <motion.div 
          className="grid gap-4 md:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            gridTemplateColumns: `repeat(${selectedSection.columnEnd - selectedSection.columnStart + 1}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: selectedSection.rowEnd - selectedSection.rowStart + 1 }).map((_, rowIndex) => (
            <motion.div 
              key={rowIndex}
              className="flex gap-4 items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
            >
              <span className="w-10 text-center text-sm font-medium text-gray-600">
                {rowIndex + 1}
              </span>
              <div className="flex flex-col gap-4 md:gap-6">
                {Array.from({ length: selectedSection.columnEnd - selectedSection.columnStart + 1 }).map((_, colIndex) => {
                  const seatId = `${rowIndex + 1}-${colIndex + 1}`;
                  return (
                    <Seat
                      key={seatId}
                      seatId={seatId}
                      type={selectedSection.type}
                      isSelected={selectedSeats.includes(seatId)}
                      isOccupied={isSeatOccupied(seatId)}
                      isReserved={isSeatReserved(seatId)}
                      price={selectedSection.price}
                      onClick={handleSeatClick}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    }
    
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seatingChart.sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-6 rounded-lg shadow-sm transition-all hover:scale-105 cursor-pointer",
              section.type === 'VIP' && "bg-purple-50 border-purple-300",
              section.type === 'REGULAR' && "bg-gray-50 border-gray-200",
              section.type === 'DISABLED' && "bg-gray-100 border-gray-200 cursor-not-allowed"
            )}
            onClick={() => {
              setSelectedSection(section);
              setIsModalOpen(true);
            }}
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
          <div className="w-full flex justify-between items-center">
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
            </div>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setSelectedSection(null);
            }}>
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

      <AnimatePresence>
        {timeRemaining !== null && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg",
              timeRemaining <= 120000 ? "bg-red-100" : "bg-yellow-100"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <p className={cn(
                "font-medium",
                timeRemaining <= 120000 ? "text-red-800" : "text-yellow-800"
              )}>
                Reserva expira en: {Math.floor(timeRemaining / 1000 / 60)}:
                {Math.floor((timeRemaining / 1000) % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <Toast
            message={toastMessage}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}