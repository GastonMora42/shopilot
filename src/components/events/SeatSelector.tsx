// components/events/SeatSelector/index.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Seat } from '@/types';
import { SeatMap } from './SeatMap';
import { SeatLegend } from './SeatLegend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

interface SeatSelectorProps {
  eventId: string;
  seats: Seat[];
  selectedSeats: Seat[];
  occupiedSeats?: Array<{
    seatId: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    temporaryReservation?: {
      sessionId: string;
      expiresAt: Date;
    };
  }>;
  onSeatSelect: (seat: Seat) => void;
  reservationTimeout?: number | null;
  maxSeats?: number;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  eventId,
  seats,
  selectedSeats,
  occupiedSeats = [],
  onSeatSelect,
  reservationTimeout,
  maxSeats = 6
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar estado de los asientos con la información de ocupación
  const updatedSeats = seats.map(seat => {
    const occupiedSeat = occupiedSeats.find(os => os.seatId === seat.seatId);
    if (occupiedSeat) {
      return {
        ...seat,
        status: occupiedSeat.status,
        temporaryReservation: occupiedSeat.temporaryReservation
      };
    }
    return seat;
  });

  const handleSeatClick = (seat: Seat) => {
    try {
      // Verificar si el asiento está disponible
      if (seat.status !== 'AVAILABLE') {
        return;
      }

      // Verificar si ya está seleccionado
      const isSelected = selectedSeats.some(s => s._id === seat._id);
      
      // Si está seleccionado, permitir deseleccionar
      if (isSelected) {
        onSeatSelect(seat);
        return;
      }

      // Verificar límite máximo de asientos
      if (selectedSeats.length >= maxSeats) {
        setError(`No puedes seleccionar más de ${maxSeats} asientos por compra`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Seleccionar el asiento
      onSeatSelect(seat);
    } catch (error) {
      console.error('Error selecting seat:', error);
      setError('Error al seleccionar el asiento');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-3 rounded-md text-sm"
        >
          {error}
        </motion.div>
      )}

      {reservationTimeout && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 text-yellow-600 p-3 rounded-md text-sm"
        >
          Tienes una reserva temporal que expira en{' '}
          {Math.ceil((reservationTimeout - Date.now()) / 1000 / 60)} minutos
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <SeatMap
                seats={updatedSeats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
              />
              <SeatLegend />
            </>
          )}
        </div>
        
        <div>
          <SelectedSeatsPanel
            selectedSeats={selectedSeats}
            onRemoveSeat={(seatId) => {
              const seatToRemove = selectedSeats.find(s => s._id === seatId);
              if (seatToRemove) {
                onSeatSelect(seatToRemove);
              }
            }}
          />

          <div className="mt-4 text-sm text-gray-500">
            <p>• Puedes seleccionar hasta {maxSeats} asientos</p>
            <p>• Los asientos se reservan temporalmente por 10 minutos</p>
            {selectedSeats.length > 0 && (
              <p>• Has seleccionado {selectedSeats.length} de {maxSeats} asientos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;