// components/admin/EventForm/steps/SeatingMap/components/SeatComponent.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { SeatComponentProps } from '../types';

export const SeatComponent: React.FC<SeatComponentProps> = ({
  seat,
  selected,
  tool,
  sectionColor
}) => {
  return (
    <motion.div
      className={`absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 rounded-md cursor-pointer 
        ${selected ? 'border-2 border-blue-500' : ''}
        ${tool === 'ERASE' ? 'hover:bg-red-200' : 'hover:bg-blue-200'}
        ${seat.status === 'DISABLED' ? 'bg-gray-300' : 'bg-white'}`}
      style={{
        x: seat.screenPosition.x,
        y: seat.screenPosition.y,
        backgroundColor: sectionColor || 'white',
        opacity: seat.status === 'DISABLED' ? 0.5 : 1
      }}
      initial={false}
      animate={{
        scale: selected ? 1.1 : 1
      }}
      transition={{ duration: 0.2 }}
    >
      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">
        {seat.label}
      </span>
    </motion.div>
  );
};