import React from "react";
import { EditorState, Point, Seat } from "../types";
import { motion } from "framer-motion";

// components/admin/EventForm/steps/SeatingMap/components/SeatComponent.tsx
interface SeatComponentProps {
    seat: Seat & { screenPosition: Point };
    selected: boolean;
    tool: EditorState['tool'];
  }
  
  export const SeatComponent: React.FC<SeatComponentProps> = React.memo(({
    seat,
    selected,
    tool
  }) => {
    return (
      <motion.div
        className={`absolute w-6 h-6 rounded-md flex items-center justify-center text-xs
          ${selected ? 'ring-2 ring-blue-500' : ''}
          ${seat.status === 'DISABLED' ? 'bg-gray-300' : 'bg-white'}
          ${tool === 'ERASE' ? 'hover:bg-red-200' : 'hover:bg-blue-50'}
        `}
        initial={false}
        animate={{
          x: seat.screenPosition.x - 12,
          y: seat.screenPosition.y - 12,
          scale: selected ? 1.1 : 1
        }}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        {seat.label}
      </motion.div>
    );
  });
  
  SeatComponent.displayName = 'SeatComponent';
  
  