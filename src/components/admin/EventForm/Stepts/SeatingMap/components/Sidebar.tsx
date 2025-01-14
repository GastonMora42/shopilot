import React, { useState } from 'react';
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
  onSectionDelete?: (sectionId: string) => void;
  onCreateSection?: (type: 'REGULAR' | 'VIP') => void;
}

interface EditableSectionProps {
  section: Section;
  isActive: boolean;
  onUpdate: (updates: Partial<Section>) => void;
  onDelete?: () => void;
  onSelect: () => void;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  section,
  isActive,
  onUpdate,
  onDelete,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-3 rounded-lg ${
        isActive ? 'bg-blue-50 border-blue-500' : 'border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: section.color }}
          />
          {isEditing ? (
            <input
              autoFocus
              value={section.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditing(false);
              }}
              className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className="font-medium cursor-pointer hover:text-blue-600"
              onDoubleClick={() => setIsEditing(true)}
              title="Doble click para editar"
            >
              {section.name}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
            title="Eliminar sección"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Precio</label>
          <input
            type="number"
            value={section.price}
            onChange={(e) => onUpdate({ price: Number(e.target.value) })}
            className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="100"
          />
        </div>
        
        <button
          onClick={onSelect}
          className={`w-full py-1 px-2 rounded text-sm transition-colors ${
            isActive 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {isActive ? 'Dibujando' : 'Seleccionar para dibujar'}
        </button>
      </div>
    </motion.div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  sections,
  activeSectionId,
  selectedSeats,
  onSectionSelect,
  onSectionUpdate,
  onBulkSeatUpdate,
  onSectionDelete,
  onCreateSection
}) => {
  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col h-full">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Secciones</h3>
            {onCreateSection && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onCreateSection('REGULAR')}
                  className="p-1 text-xs rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                  title="Agregar sección regular"
                >
                  + Regular
                </button>
                <button
                  onClick={() => onCreateSection('VIP')}
                  className="p-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200"
                  title="Agregar sección VIP"
                >
                  + VIP
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {sections.map(section => (
              <EditableSection
                key={section.id}
                section={section}
                isActive={activeSectionId === section.id}
                onUpdate={(updates) => onSectionUpdate(section.id, updates)}
                onDelete={onSectionDelete ? () => onSectionDelete(section.id) : undefined}
                onSelect={() => onSectionSelect(section.id)}
              />
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
                    className="w-full rounded-md border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => onBulkSeatUpdate({ status: e.target.value as 'AVAILABLE' | 'DISABLED' })}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="DISABLED">Deshabilitado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sección
                  </label>
                  <select
                    className="w-full rounded-md border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
};