// components/admin/EventForm/steps/SeatingMap/components/ZoomControls.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomChange,
  onReset
}) => {
  const handleZoomIn = () => onZoomChange(zoom * 1.2);
  const handleZoomOut = () => onZoomChange(zoom / 1.2);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col bg-white rounded-lg shadow-lg">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 rounded-t-lg"
        title="Acercar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </motion.button>
      
      <div className="px-2 py-1 text-sm text-center border-t border-b border-gray-200">
        {Math.round(zoom * 100)}%
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100"
        title="Alejar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="p-2 hover:bg-gray-100 rounded-b-lg border-t border-gray-200"
        title="Restablecer zoom"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </motion.button>
    </div>
  );
};
