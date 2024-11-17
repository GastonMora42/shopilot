// components/admin/EventForm/steps/SeatedTickets/SeatedTicketsStep.tsx
import React, { useState, useMemo } from 'react';
import { Section, SeatLayout } from './types';
import { SectionForm } from './SectionForm';
import { LayoutSelector } from './LayoutSelector';
import { motion, AnimatePresence } from 'framer-motion';

interface SeatedTicketsStepProps {
  layout: SeatLayout;
  onChange: (layout: SeatLayout) => void;
}

export const SeatedTicketsStep: React.FC<SeatedTicketsStepProps> = ({
  layout,
  onChange
}) => {
  const [showLayoutSelector, setShowLayoutSelector] = useState(!layout.customLayout);

  const handleAddSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      name: '',
      type: 'REGULAR',
      price: 0,
      color: '#3B82F6'
    };
    
    onChange({
      ...layout,
      sections: [...layout.sections, newSection]
    });
  };

  const handleUpdateSection = (index: number, updates: Partial<Section>) => {
    const updatedSections = layout.sections.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    );
    onChange({ ...layout, sections: updatedSections });
  };

  const handleDeleteSection = (index: number) => {
    onChange({
      ...layout,
      sections: layout.sections.filter((_, i) => i !== index)
    });
  };

  const handleLayoutSelect = (useCustomLayout: boolean) => {
    onChange({ ...layout, customLayout: useCustomLayout });
    setShowLayoutSelector(false);
  };

  if (showLayoutSelector) {
    return <LayoutSelector onSelect={handleLayoutSelect} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Configuración de Secciones</h3>
        <button
          type="button"
          onClick={handleAddSection}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Sección
        </button>
      </div>

      {!layout.customLayout && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Filas
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full p-2 border rounded-md"
              value={layout.rows}
              onChange={(e) => onChange({ ...layout, rows: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asientos por Fila
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full p-2 border rounded-md"
              value={layout.columns}
              onChange={(e) => onChange({ ...layout, columns: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        <motion.div className="space-y-4">
          {layout.sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SectionForm
                section={section}
                onUpdate={(updates) => handleUpdateSection(index, updates)}
                onDelete={() => handleDeleteSection(index)}
                isLast={layout.sections.length === 1}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};