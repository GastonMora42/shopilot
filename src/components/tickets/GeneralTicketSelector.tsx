// components/events/tickets/GeneralTicketSelector.tsx
import React from 'react';
import { GeneralTicket, SelectedGeneralTicket } from '@/types/event';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneralTicketSelectorProps {
  tickets: GeneralTicket[];
  selectedTickets: SelectedGeneralTicket[];
  onTicketSelect: (ticketId: string, quantity: number) => void;
  maxTicketsPerPurchase: number;
}

export const GeneralTicketSelector: React.FC<GeneralTicketSelectorProps> = ({
  tickets,
  selectedTickets,
  onTicketSelect,
  maxTicketsPerPurchase
}) => {
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

  const handleQuantityChange = (ticketId: string, newQuantity: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const totalSelected = getTotalSelectedTickets();
    const currentQuantity = getTicketQuantity(ticketId);
    const difference = newQuantity - currentQuantity;

    // Verificar si el nuevo total excedería el máximo permitido
    if (totalSelected + difference > maxTicketsPerPurchase) {
      console.warn('Excede el máximo de tickets permitidos');
      return;
    }

    // Verificar si hay suficientes tickets disponibles
    if (newQuantity > ticket.quantity) {
      console.warn('No hay suficientes tickets disponibles');
      return;
    }

    onTicketSelect(ticketId, newQuantity);
  };

  return (
    <div className="space-y-6">
      {tickets.map(ticket => {
        const currentQuantity = getTicketQuantity(ticket.id);
        const totalSelected = getTotalSelectedTickets();
        const availableQuantity = ticket.quantity - currentQuantity;

        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{ticket.name}</h3>
                {ticket.description && (
                  <p className="text-gray-600 mt-1">{ticket.description}</p>
                )}
                <p className="text-lg font-medium mt-2">
                  ${ticket.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Disponibles: {availableQuantity}
                </p>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(ticket.id, Math.max(0, currentQuantity - 1))}
                    disabled={currentQuantity === 0}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Reducir cantidad"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  <span className="w-8 text-center font-medium">
                    {currentQuantity}
                  </span>

                  <button
                    onClick={() => handleQuantityChange(ticket.id, currentQuantity + 1)}
                    disabled={
                      currentQuantity >= ticket.quantity ||
                      totalSelected >= maxTicketsPerPurchase ||
                      availableQuantity <= 0
                    }
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Aumentar cantidad"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                    </svg>
                  </button>
                </div>

                {currentQuantity > 0 && (
                  <div className="text-sm text-gray-600">
                    Subtotal: ${(ticket.price * currentQuantity).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
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
                <div key={selected.ticketId} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{ticket.name}</span>
                    <span className="text-gray-500 ml-2">× {selected.quantity}</span>
                  </div>
                  <span>${(ticket.price * selected.quantity).toLocaleString()}</span>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2 font-medium flex justify-between text-lg">
              <span>Total</span>
              <span>${calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>• Puedes seleccionar hasta {maxTicketsPerPurchase} tickets en total</p>
            <p>• Has seleccionado {getTotalSelectedTickets()} de {maxTicketsPerPurchase} tickets</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};