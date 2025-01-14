// components/tickets/GeneralTickets.tsx
import React from 'react';
import { GeneralTicket, SelectedGeneralTicket } from '@/types/event';

interface GeneralTicketsProps {
  tickets: GeneralTicket[];
  selectedTickets: SelectedGeneralTicket[];
  onTicketSelect: (ticketId: string, quantity: number) => void;
  maxTicketsPerPurchase?: number;
}

export const GeneralTickets: React.FC<GeneralTicketsProps> = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  maxTicketsPerPurchase = 10
}) => {
  const getTotalSelectedTickets = (): number => {
    return selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  const getTicketQuantity = (ticketId: string): number => {
    const selected = selectedTickets.find(t => t.ticketId === ticketId);
    return selected?.quantity ?? 0;
  };

  const calculateTotal = (): number => {
    return selectedTickets.reduce((sum, selectedTicket) => {
      const ticket = tickets.find(t => t.id === selectedTicket.ticketId);
      return sum + (ticket?.price ?? 0) * selectedTicket.quantity;
    }, 0);
  };

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const currentQuantity = getTicketQuantity(ticket.id);
        const availableQuantity = ticket.quantity;
        const totalSelected = getTotalSelectedTickets();

        return (
          <div 
            key={ticket.id}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{ticket.name}</h3>
                {ticket.description && (
                  <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                )}
                <p className="text-lg font-medium mt-2">
                  ${ticket.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Disponibles: {availableQuantity}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onTicketSelect(ticket.id, Math.max(0, currentQuantity - 1))}
                  disabled={currentQuantity === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-full border
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Reducir cantidad"
                >
                  -
                </button>
                
                <span className="w-8 text-center font-medium">
                  {currentQuantity}
                </span>
                
                <button
                  onClick={() => {
                    const newQuantity = currentQuantity + 1;
                    if (newQuantity <= availableQuantity && 
                        totalSelected < maxTicketsPerPurchase) {
                      onTicketSelect(ticket.id, newQuantity);
                    }
                  }}
                  disabled={
                    currentQuantity >= availableQuantity ||
                    totalSelected >= maxTicketsPerPurchase
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full border
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            {currentQuantity > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Subtotal: ${(ticket.price * currentQuantity).toFixed(2)}
              </div>
            )}
          </div>
        );
      })}

      {selectedTickets.length > 0 && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900">
            Resumen de selección
          </h4>
          <div className="mt-2 space-y-2">
            {selectedTickets.map(selectedTicket => {
              const ticket = tickets.find(t => t.id === selectedTicket.ticketId);
              if (!ticket) return null;

              return (
                <div key={selectedTicket.ticketId} className="flex justify-between text-sm">
                  <span>{ticket.name} × {selectedTicket.quantity}</span>
                  <span>${(ticket.price * selectedTicket.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2 font-medium flex justify-between">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralTickets;