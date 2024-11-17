// components/admin/EventForm/steps/SeatedTickets/LayoutSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface LayoutSelectorProps {
  onSelect: (useCustomLayout: boolean) => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(false)}
        className="p-6 border rounded-lg text-left hover:border-blue-500"
      >
        <h4 className="font-medium mb-2">Layout Simple</h4>
        <p className="text-sm text-gray-600">
          Configura filas y columnas uniformes. Ideal para teatros y auditorios
          con disposición tradicional.
        </p>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(true)}
        className="p-6 border rounded-lg text-left hover:border-blue-500"
      >
        <h4 className="font-medium mb-2">Layout Personalizado</h4>
        <p className="text-sm text-gray-600">
          Crea una disposición personalizada de asientos. Perfecto para
          venues con layouts únicos.
        </p>
      </motion.button>
    </div>
  );
};

