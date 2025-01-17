// components/admin/EventForm/steps/SeatingMap/components/TemplateSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { templates } from '../templates';

interface TemplateSelectorProps {
  onSelect: (template: typeof templates[0]) => void;
  onCustomLayout: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onCustomLayout
}) => {
  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Seleccionar Plantilla
      </h3>
      
      <div className="grid grid-cols-3 gap-6">
        {templates.map(template => (
          <motion.button
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(template)}
            className="p-4 border rounded-lg text-left hover:border-blue-500"
          >
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="rounded-md object-cover"
              />
            </div>
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            <p className="text-sm text-gray-500 mt-1">
              {template.description}
            </p>
          </motion.button>
        ))}

        {/* Botón de layout personalizado */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCustomLayout}
          className="p-4 border-2 border-dashed rounded-lg text-center hover:border-blue-500"
        >
          <div className="aspect-w-16 aspect-h-9 mb-4 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h4 className="font-medium text-gray-900">Diseño Personalizado</h4>
          <p className="text-sm text-gray-500 mt-1">
            Crea tu propio layout desde cero
          </p>
        </motion.button>
      </div>
    </div>
  );
};