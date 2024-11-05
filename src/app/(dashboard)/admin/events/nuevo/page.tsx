// app/(dashboard)/eventos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BasicInfoStep } from '@/components/events/BasicInfoStept';
import { SeatingStep } from '@/components/events/SeatingStep';
import { PricingStep } from '@/components/events/PricingSteps';
import { ReviewStep } from '@/components/events/ReviewStep';
import { StepIndicator } from '@/components/events/StepIndicator';

type StepType = 'info' | 'seating' | 'pricing' | 'review';

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false); // Agregar el estado aquí
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    seatingChart: {
      rows: 10,
      columns: 10,
      sections: [
        {
          name: 'Regular',
          type: 'REGULAR' as const,
          price: 1000,
          rowStart: 0,
          rowEnd: 7,
          columnStart: 0,
          columnEnd: 10
        },
        {
          name: 'VIP',
          type: 'VIP' as const,
          price: 2000,
          rowStart: 8,
          rowEnd: 10,
          columnStart: 0,
          columnEnd: 10
        }
      ]
    }
  });

  const handleBasicInfoChange = (info: any) => {
    setEventData(prev => ({ ...prev, ...info }));
  };

  const handleSeatingChange = (seating: any) => {
    setEventData(prev => ({
      ...prev,
      seatingChart: {
        ...prev.seatingChart,
        rows: seating.rows,
        columns: seating.columns
      }
    }));
  };

  const handleSectionsChange = (sections: any) => {
    setEventData(prev => ({
      ...prev,
      seatingChart: {
        ...prev.seatingChart,
        sections
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const formattedData = {
        ...eventData,
        date: new Date(eventData.date).toISOString()
      };
  
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el evento');
      }
  
      alert('¡Evento creado exitosamente!');
      router.push(`/eventos/${data._id}`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Ocurrió un error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Record<StepType, {
    title: string;
    component: React.ReactNode;
  }> = {
    info: {
      title: 'Información Básica',
      component: <BasicInfoStep data={eventData} onChange={handleBasicInfoChange} />
    },
    seating: {
      title: 'Configuración de Asientos',
      component: <SeatingStep data={eventData.seatingChart} onChange={handleSeatingChange} />
    },
    pricing: {
      title: 'Precios y Secciones',
      component: <PricingStep sections={eventData.seatingChart.sections} onChange={handleSectionsChange} />
    },
    review: {
      title: 'Revisar y Crear',
      component: <ReviewStep data={eventData} onSubmit={handleSubmit} />
    }
  };

  const validateStep = (currentStep: StepType): boolean => {
    switch (currentStep) {
      case 'info':
        return !!(eventData.name && eventData.description && eventData.date && eventData.location);
      case 'seating':
        return eventData.seatingChart.rows > 0 && eventData.seatingChart.columns > 0;
      case 'pricing':
        return eventData.seatingChart.sections.every(
          section => section.name && section.price > 0
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const currentStep = steps[step];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Evento</h1>

      <div className="mb-8">
        <StepIndicator 
          currentStep={step} 
          steps={Object.keys(steps) as StepType[]} 
        />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{currentStep.title}</h2>
        {currentStep.component}
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const stepArray = Object.keys(steps) as StepType[];
            const prevIndex = stepArray.indexOf(step) - 1;
            if (prevIndex >= 0) {
              setStep(stepArray[prevIndex]);
            }
          }}
          disabled={step === 'info'}
        >
          Atrás
        </Button>

        <Button
          onClick={() => {
            if (!validateStep(step)) {
              alert('Por favor completa todos los campos requeridos');
              return;
            }

            if (step === 'review') {
              handleSubmit();
            } else {
              const stepArray = Object.keys(steps) as StepType[];
              const nextIndex = stepArray.indexOf(step) + 1;
              setStep(stepArray[nextIndex]);
            }
          }}
          disabled={isSubmitting} // Desactivar el botón mientras se envían los datos
        >
          {step === 'review' ? 'Crear Evento' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}
