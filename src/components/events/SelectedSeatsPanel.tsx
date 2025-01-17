// components/events/SeatSelector/SelectedSeatsPanel.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Seat } from '@/types';

interface SelectedSeatsPanelProps {
  selectedSeats: Seat[];
  onRemoveSeat: (seatId: string) => void;
}

export const SelectedSeatsPanel: React.FC<SelectedSeatsPanelProps> = ({
  selectedSeats,
  onRemoveSeat
}) => {
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Asientos Seleccionados
      </h3>

      {selectedSeats.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Selecciona los asientos que deseas reservar
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <AnimatePresence>
              {selectedSeats.map((seat) => (
                <motion.div
                  key={seat._id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{seat.label}</p>
                    <p className="text-sm text-gray-500">{seat.section}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">
                      ${seat.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onRemoveSeat(seat._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-medium">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};