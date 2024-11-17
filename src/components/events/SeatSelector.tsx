// components/events/SeatSelect/index.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Seat } from '@/types';
import { SeatMap } from './SeatMap';
import { SeatLegend } from './SeatLegend';
import { SelectedSeatsPanel } from './SelectedSeatsPanel';

interface SeatSelectorProps {
  eventId: string;
  onSeatsSelected: (seats: Seat[]) => void;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  eventId,
  onSeatsSelected
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeats();
  }, [eventId]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/events/${eventId}/seats`);
      if (!response.ok) throw new Error('Error loading seats');
      
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      setError('Error cargando los asientos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = async (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return;
    
    try {
      const newSelection = selectedSeats.includes(seat)
        ? selectedSeats.filter(s => s.id !== seat.id)
        : [...selectedSeats, seat];
      
      setSelectedSeats(newSelection);
      onSeatsSelected(newSelection);
    } catch (err) {
      console.error('Error selecting seat:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SeatMap
          seats={seats}
          selectedSeats={selectedSeats}
          onSeatClick={handleSeatClick}
        />
        <SeatLegend />
      </div>
      
      <div>
        <SelectedSeatsPanel
          selectedSeats={selectedSeats}
          onRemoveSeat={(seatId) => {
            setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
          }}
        />
      </div>
    </div>
  );
};