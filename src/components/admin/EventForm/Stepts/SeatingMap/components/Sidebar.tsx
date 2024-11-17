
// components/admin/EventForm/steps/SeatingMap/components/Sidebar.tsx
import React from 'react';
import { Seat } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from "../../SeatedTickets/types";

interface SidebarProps {
  sections: Section[];
  activeSectionId: string | null;
  selectedSeats: string[];
  onSectionSelect: (sectionId: string) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<Section>) => void;
  onBulkSeatUpdate: (updates: Partial<Seat>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sections,
  activeSectionId,
  selectedSeats,
  onSectionSelect,
  onSectionUpdate,
  onBulkSeatUpdate
}) => {
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Secciones</h3>
        <div className="space-y-2">
          {sections.map(section => (
            <motion.button
              key={section.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSectionSelect(section.id)}
              className={`w-full p-3 rounded-lg text-left ${
                activeSectionId === section.id
                  ? 'bg-blue-50 border-blue-500'
                  : 'border border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: section.color }}
                />
                <span className="font-medium">{section.name}</span>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Precio: ${section.price}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t pt-4"
          >
            <h3 className="font-medium text-gray-900 mb-4">
              Asientos Seleccionados ({selectedSeats.length})
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  className="w-full rounded-md border-gray-300"
                  onChange={(e) => onBulkSeatUpdate({ status: e.target.value as 'ACTIVE' | 'DISABLED' })}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="DISABLED">Deshabilitado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sección
                </label>
                <select
                  className="w-full rounded-md border-gray-300"
                  onChange={(e) => onBulkSeatUpdate({ sectionId: e.target.value })}
                >
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

