  // components/admin/EventForm/steps/SeatedTickets/SectionForm.tsx
  import React from 'react';
  import { Section } from './types';
  
  interface SectionFormProps {
    section: Section;
    onUpdate: (updates: Partial<Section>) => void;
    onDelete: () => void;
    isLast: boolean;
  }
  
  export const SectionForm: React.FC<SectionFormProps> = ({
    section,
    onUpdate,
    onDelete,
    isLast
  }) => {
    const sectionTypes = [
      { value: 'REGULAR', label: 'Regular' },
      { value: 'VIP', label: 'VIP' },
      { value: 'DISABLED', label: 'Accesibilidad' }
    ] as const;
  
    const colors = [
      { value: '#EF4444', label: 'Rojo' },
      { value: '#3B82F6', label: 'Azul' },
      { value: '#10B981', label: 'Verde' },
      { value: '#F59E0B', label: 'Amarillo' },
      { value: '#8B5CF6', label: 'Púrpura' }
    ];
  
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Sección</h4>
          {!isLast && (
            <button
              type="button"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Eliminar
            </button>
          )}
        </div>
  
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-md"
              value={section.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="ej: Platea Alta"
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={section.type}
              onChange={(e) => onUpdate({ type: e.target.value as Section['type'] })}
            >
              {sectionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-md"
              value={section.price}
              onChange={(e) => onUpdate({ price: Number(e.target.value) })}
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={section.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
            >
              {colors.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };
  
  