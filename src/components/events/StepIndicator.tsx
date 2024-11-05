// components/StepIndicator.tsx
type StepType = 'info' | 'seating' | 'pricing' | 'review';

interface StepIndicatorProps {
  steps: StepType[];
  currentStep: StepType; // Cambiado de string a StepType
}
  
  const stepLabels = {
    info: 'Información',
    seating: 'Asientos',
    pricing: 'Precios',
    review: 'Revisar'
  };
  
  export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCurrent = step === currentStep;
          const isCompleted = steps.indexOf(currentStep) > steps.indexOf(step);
  
          return (
            <div key={step} className="flex items-center">
              {/* Línea conectora */}
              {index > 0 && (
                <div 
                  className={`w-24 h-1 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
              
              {/* Círculo indicador */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isCurrent ? 'bg-primary text-white' : 
                      isCompleted ? 'bg-primary text-white' : 'bg-gray-200'
                    }
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="text-sm mt-1">{stepLabels[step]}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  