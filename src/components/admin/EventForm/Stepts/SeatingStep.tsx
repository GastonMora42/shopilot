// components/admin/EventForm/steps/SeatingStep.tsx
import React, { useState } from 'react';
import { SeatingMapEditor } from './SeatingMap/SeatingMapEditor';
import { TemplateSelector } from './SeatingMap/components/TemplateSelector';
import { TemplateConfigurator } from './SeatingMap/components/TemplateConfigurator';
import { SeatingPreview } from './SeatingMap/components/SeatingPreview';
import { LayoutConfig, LayoutTemplate } from '@/types/editor';

interface SeatingStepProps {
  initialLayout?: LayoutConfig;
  onChange: (data: LayoutConfig) => void;
  onSave?: () => Promise<void>;
}

type StepState = 
  | { type: 'TEMPLATE_SELECT' }
  | { type: 'TEMPLATE_CONFIG'; template: LayoutTemplate }
  | { type: 'CUSTOM_EDITOR'; layout: LayoutConfig }
  | { type: 'EDITOR'; layout: LayoutConfig };

  export const SeatingStep: React.FC<SeatingStepProps> = ({
    initialLayout,
    onChange,
    onSave
  }) => {
    const [stepState, setStepState] = useState<StepState>(
      initialLayout 
        ? { type: 'EDITOR', layout: initialLayout }
        : { type: 'TEMPLATE_SELECT' }
    );
    const [errors, setErrors] = useState<string[]>([]);
  
    // Validación del layout
    const validateLayout = (layout: LayoutConfig): boolean => {
      const newErrors: string[] = [];
  
      // Validar secciones
      if (!layout.sections.length) {
        newErrors.push('Debe crear al menos una sección');
        return false;
      }
  
      // Validar que cada sección tenga asientos
      layout.sections.forEach(section => {
        const sectionSeats = layout.seats.filter(seat => seat.sectionId === section.id);
        if (sectionSeats.length === 0) {
          newErrors.push(`La sección "${section.name}" no tiene asientos asignados`);
        }
        if (section.price <= 0) {
          newErrors.push(`La sección "${section.name}" debe tener un precio válido`);
        }
      });
  
      // Validar dimensiones
      if (layout.rows <= 0 || layout.columns <= 0) {
        newErrors.push('Las dimensiones del mapa son inválidas');
      }
  
      setErrors(newErrors);
      return newErrors.length === 0;
    };
  
    const handleLayoutChange = (layout: LayoutConfig) => {
      validateLayout(layout);
      onChange(layout);
    };
  
    return (
      <div className="h-full">
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-red-700 font-medium mb-2">Por favor corrige los siguientes errores:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}

      {(stepState.type === 'CUSTOM_EDITOR' || stepState.type === 'EDITOR') && (
        <div className="h-full">
          <SeatingMapEditor
            initialSeats={stepState.layout.seats}
            onChange={onChange}
            onSave={onSave} initialSections={[]}          />
        </div>
      )}
    </div>
  );
};