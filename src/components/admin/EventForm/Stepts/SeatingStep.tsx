// components/admin/EventForm/steps/SeatingStep.tsx
import React, { useState } from 'react';
import { SeatingMapEditor } from './SeatingMap/SeatingMapEditor';
import { TemplateSelector } from './SeatingMap/components/TemplateSelector';
import { TemplateConfigurator } from './SeatingMap/components/TemplateConfigurator';
import { SeatingPreview } from './SeatingMap/components/SeatingPreview';
import { PREDEFINED_TEMPLATES } from './SeatingMap/templates';
import { LayoutTemplate, LayoutConfig } from './SeatingMap/types/layout';

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

  const handleTemplateSelect = (template: LayoutTemplate) => {
    setStepState({ type: 'TEMPLATE_CONFIG', template });
  };

  const handleCustomLayout = () => {
    setStepState({
      type: 'CUSTOM_EDITOR',
      layout: {
        seats: [],
        sections: [{
          id: 'default',
          name: 'General',
          type: 'REGULAR',
          color: '#3B82F6',
          price: 100,
          rowStart: 0
        }]
      }
    });
  };

  const handleLayoutGenerate = (layout: LayoutConfig) => {
    setStepState({ type: 'EDITOR', layout });
    onChange(layout);
  };

  return (
    <div className="h-full">
      {stepState.type === 'TEMPLATE_SELECT' && (
        <TemplateSelector
          templates={PREDEFINED_TEMPLATES}
          onSelect={handleTemplateSelect}
          onCustomLayout={handleCustomLayout}
        />
      )}

      {stepState.type === 'TEMPLATE_CONFIG' && (
        <div className="grid grid-cols-2 gap-6 h-full">
          <TemplateConfigurator
            template={stepState.template}
            onGenerate={handleLayoutGenerate}
            onBack={() => setStepState({ type: 'TEMPLATE_SELECT' })}
          />
          <div className="border-l pl-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Vista Previa
            </h4>
            <SeatingPreview
              seats={[]} // Se actualizará con la preview del template
              sections={[]} // Se actualizará con la preview del template
              width={400}
              height={300}
            />
          </div>
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