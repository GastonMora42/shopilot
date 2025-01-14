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

  return (
    <div className="space-y-4">
      {tickets.map(ticket => {
        const selectedTicket = selectedTickets.find(t => t.ticketId === ticket.id);
        const currentQuantity = selectedTicket?.quantity ?? 0;
        const totalSelected = getTotalSelectedTickets();

        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4"
          >
            {/* Contenido del ticket... */}
          </motion.div>
        );
      })}

      {/* Resumen de selección... */}
    </div>
  );
};