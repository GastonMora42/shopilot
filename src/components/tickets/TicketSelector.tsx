// components/events/TicketSelector/index.tsx
import React, { useEffect } from 'react';
import { Event, SelectedGeneralTicket, GeneralTicket } from '@/types/event';
import { SeatSelector } from '../events/SeatSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { Seat } from '@/types'; // Importar Seat desde types/index

interface TicketSelectorProps {
  event: Event;
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

const GeneralTicketSelector: React.FC<{
  tickets: GeneralTicket[];
  selectedTickets: SelectedGeneralTicket[];
  onTicketSelect: (ticketId: string, quantity: number) => void;
  maxTicketsPerPurchase: number;
}> = ({ tickets, selectedTickets, onTicketSelect, maxTicketsPerPurchase }) => {
  const getTotalSelectedTickets = (): number => {
    return selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  const getTicketQuantity = (ticketId: string): number => {
    const selected = selectedTickets.find(t => t.ticketId === ticketId);
    return selected?.quantity ?? 0;
  };

  const calculateTotal = (): number => {
    return selectedTickets.reduce((sum, selected) => {
      const ticket = tickets.find(t => t.id === selected.ticketId);
      return sum + (ticket?.price ?? 0) * selected.quantity;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {tickets.map(ticket => {
        const currentQuantity = getTicketQuantity(ticket.id);
        const totalSelected = getTotalSelectedTickets();

        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{ticket.name}</h3>
                {ticket.description && (
                  <p className="text-gray-600 mt-1">{ticket.description}</p>
                )}
                <p className="text-lg font-medium mt-2">
                  ${ticket.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onTicketSelect(ticket.id, Math.max(0, currentQuantity - 1))}
                  disabled={currentQuantity === 0}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <span className="w-8 text-center font-medium">
                  {currentQuantity}
                </span>

                <button
                  onClick={() => {
                    if (currentQuantity < ticket.quantity && 
                        totalSelected < maxTicketsPerPurchase) {
                      onTicketSelect(ticket.id, currentQuantity + 1);
                    }
                  }}
                  disabled={
                    currentQuantity >= ticket.quantity ||
                    totalSelected >= maxTicketsPerPurchase
                  }
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                  </svg>
                </button>
              </div>
            </div>

            {currentQuantity > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                Subtotal: ${(ticket.price * currentQuantity).toLocaleString()}
              </div>
            )}
          </motion.div>
        );
      })}

      {selectedTickets.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 bg-gray-50 rounded-lg p-6"
        >
          <h4 className="font-medium text-lg mb-4">Resumen de selección</h4>
          <div className="space-y-2">
            {selectedTickets.map(selected => {
              const ticket = tickets.find(t => t.id === selected.ticketId);
              if (!ticket) return null;

              return (
                <div key={selected.ticketId} className="flex justify-between">
                  <span>{ticket.name} × {selected.quantity}</span>
                  <span>${(ticket.price * selected.quantity).toLocaleString()}</span>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2 font-medium flex justify-between">
              <span>Total</span>
              <span>${calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

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
    console.log('TicketSelector mounted with event type:', event?.eventType);
    if (event?.eventType === 'SEATED') {
      console.log('Seats available:', seats?.length);
    }
  }, [event, seats]);

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