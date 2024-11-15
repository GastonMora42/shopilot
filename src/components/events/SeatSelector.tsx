// components/SeatSelector.tsx
'use client';


import { useState, useCallback, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/app/lib/utils';
import { IEvent, ISection } from '@/types';
import { CountdownTimer } from './CountdownTimer';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { MinusIcon, PlusIcon, RefreshCwIcon } from 'lucide-react'; // Asegúrate de importar estos iconos

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

interface TemporaryReservation {
  sessionId: string;
  expiresAt: Date;
}

interface OccupiedSeat {
  seatId: string;
  status: SeatStatus;
  temporaryReservation?: TemporaryReservation;
}

interface SeatSelectorProps {
  eventId: string;
  seatingChart: IEvent['seatingChart'];
  selectedSeats: string[];
  occupiedSeats: OccupiedSeat[];
  onSeatSelect: (seats: string[]) => Promise<void>;
  reservationTimeout?: number | null;
  maxSeats?: number;
}

const ZoomControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => zoomOut()}
        className="p-2"
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => resetTransform()}
        className="p-2"
      >
        <RefreshCwIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => zoomIn()}
        className="p-2"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

const Seat = memo(function Seat({
  seatId,
  displayId,
  type,
  isSelected,
  isOccupied,
  isReserved,
  price,
  onClick
}: SeatProps) {
  return (
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
});

export function SeatSelector({
  eventId,
  seatingChart,
  reservationTimeout,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  maxSeats = 6
}: SeatSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => 
    localStorage.getItem('sessionId') || crypto.randomUUID()
  );

  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

  // Efecto para limpiar errores
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Efecto para verificar asientos periódicamente
  useEffect(() => {
    const checkSeats = async () => {
      try {
        await fetch(`/api/events/${eventId}/seats/cleanup`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Error checking seats:', error);
      }
    };

    checkSeats(); // Verificación inicial
    const interval = setInterval(checkSeats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const isSeatOccupied = useCallback((seatId: string): boolean => {
    const seat = occupiedSeats.find(seat => seat.seatId === seatId);
    return seat?.status === 'OCCUPIED';
  }, [occupiedSeats]);

  const isSeatReserved = useCallback((seatId: string): boolean => {
    const seat = occupiedSeats.find(seat => seat.seatId === seatId);
    return seat?.status === 'RESERVED' && 
           seat.temporaryReservation?.sessionId !== sessionId;
  }, [occupiedSeats, sessionId]);

  const handleSeatClick = async (seatId: string, type: 'REGULAR' | 'VIP' | 'DISABLED') => {
    try {
      if (type === 'DISABLED') return;
      
      const isCurrentlySelected = selectedSeats.includes(seatId);
  
      // Si está deseleccionando, simplemente actualizamos el estado local
      if (isCurrentlySelected) {
        const newSelectedSeats = selectedSeats.filter(id => id !== seatId);
        await onSeatSelect(newSelectedSeats);
        return;
      }
  
      // Verificar límite de selección
      if (selectedSeats.length >= maxSeats) {
        setError(`No puedes seleccionar más de ${maxSeats} asientos`);
        return;
      }
  
      // Solo verificamos disponibilidad, sin hacer reserva
      const verifyResponse = await fetch(`/api/events/${eventId}/seats/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatIds: [seatId],
          sessionId
        })
      });
  
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok || !verifyData.available) {
        setError('Este asiento no está disponible');
        return;
      }
  
      // Actualizamos solo la selección local
      await onSeatSelect([...selectedSeats, seatId]);
    } catch (error) {
      console.error('Error al seleccionar asiento:', error);
      setError('Error al seleccionar el asiento');
    }
  };

  const formatSeatId = useCallback((dbSeatId: string): string => {
    const [row, col] = dbSeatId.split('-').map(Number);
    return `${String.fromCharCode(64 + row)}${col}`;
  }, []);
  
  const renderSectionGrid = useCallback((section: ISection) => {
    const rows = section.rowEnd - section.rowStart + 1;
    const cols = section.columnEnd - section.columnStart + 1;
  
    return (
      <div className="flex flex-col gap-2 min-w-max">
        {/* Header con números de columna */}
        <div className="flex pl-10 overflow-visible">
          {Array.from({ length: cols }).map((_, idx) => (
            <div key={idx} className="w-12 md:w-14 text-center text-xs text-gray-500 flex-shrink-0">
              {idx + section.columnStart}
            </div>
          ))}
        </div>
  
        {/* Grid de asientos */}
        <div className="grid gap-2">
          {Array.from({ length: rows }).map((_, rowIdx) => {
            const actualRow = rowIdx + section.rowStart;
            return (
              <div key={rowIdx} className="flex items-center">
                {/* Letra de fila */}
                <div className="w-10 text-center text-sm font-medium text-gray-600 flex-shrink-0">
                  {String.fromCharCode(65 + rowIdx)}
                </div>
                {/* Asientos de la fila */}
                <div className="flex gap-2 overflow-visible">
                  {Array.from({ length: cols }).map((_, colIdx) => {
                    const actualCol = colIdx + section.columnStart;
                    const seatId = `${actualRow}-${actualCol}`;
                    const displayId = `${String.fromCharCode(65 + rowIdx)}${colIdx + 1}`;
  
                    return (
                      <Seat
                        key={seatId}
                        seatId={seatId}
                        displayId={displayId}
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
  }, [selectedSeats, isSeatOccupied, isSeatReserved, handleSeatClick]);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-lg font-semibold">Seleccionar Asientos</h2>
        <div className="flex items-center gap-4">
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
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        className="max-w-[95vw]"
      >
        <ModalHeader>
          <h3 className="text-xl font-semibold">Mapa de Asientos</h3>
        </ModalHeader>
        <ModalContent>
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={2}
            centerOnInit
            limitToBounds={false}
            smooth={true}
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: false }}
            pinch={{ disabled: false }}
            panning={{ disabled: false }}
          >
            {() => (
              <>
                <div className="flex justify-between items-center mb-4">
                  <ZoomControls />
                </div>
                <TransformComponent 
                  wrapperClass="w-full max-h-[60vh]"
                  contentClass="w-full h-full"
                >
                  <div className="space-y-8 p-4">
                    {seatingChart.sections.map((section, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-medium">{section.name}</h4>
                          <span className="text-sm text-gray-600">
                            ${section.price.toLocaleString('es-ES')}
                          </span>
                        </div>
                        {renderSectionGrid(section)}
                      </div>
                    ))}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </ModalContent>
        <ModalFooter>
          <div className="flex flex-wrap gap-4 justify-between w-full">
            <div className="flex gap-4 flex-wrap">
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
            {selectedSeats
              .map(formatSeatId)
              .sort()
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}