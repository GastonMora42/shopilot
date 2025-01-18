// components/events/TicketSelector/index.tsx
import React, { useEffect } from 'react';
import { SeatSelector } from '../events/SeatSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { Seat } from '@/types';
import { GeneralTicketSelector } from './GeneralTicketSelector';
import { IEvent, SelectedGeneralTicket } from '@/types/event';


interface TicketSelectorProps {
  event: IEvent;
  seats: Seat[];
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  occupiedSeats?: Array<{
    seatId: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    temporaryReservation?: {
      sessionId: string;
      expiresAt: Date;
    };
  }>;
  onSeatSelect: (seat: Seat) => void;
  onTicketSelect: (ticketId: string, quantity: number) => void;
  reservationTimeout?: number | null;
  isLoading?: boolean;
  error?: string;
}



export const TicketSelector: React.FC<TicketSelectorProps> = ({
  event,
  seats,
  selectedSeats,
  selectedTickets,
  occupiedSeats,
  onSeatSelect,
  onTicketSelect,
  reservationTimeout,
  isLoading,
  error
}) => {
  useEffect(() => {
    console.log('TicketSelector mounted with:', {
      eventType: event?.eventType,
      seatsCount: seats?.length,
      selectedSeatsCount: selectedSeats?.length,
      selectedTicketsCount: selectedTickets?.length,
      hasOccupiedSeats: !!occupiedSeats?.length
    });
  }, [event, seats, selectedSeats, selectedTickets, occupiedSeats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-red-600 p-4 bg-red-50 rounded-lg"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={event.eventType}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {event.eventType === 'SEATED' ? (
          <SeatSelector
            eventId={event._id}
            seats={seats}
            selectedSeats={selectedSeats}
            occupiedSeats={occupiedSeats}
            onSeatSelect={onSeatSelect}
            reservationTimeout={reservationTimeout}
            maxSeats={event.maxTicketsPerPurchase}
          />
        ) : (
          <GeneralTicketSelector
            tickets={event.generalTickets || []}
            selectedTickets={selectedTickets}
            onTicketSelect={onTicketSelect}
            maxTicketsPerPurchase={event.maxTicketsPerPurchase}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TicketSelector;