// app/(dashboard)/eventos/nuevo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BasicInfoStep } from '@/components/admin/EventForm/Stepts/BasicInfoStep';
import { EventTypeStep } from '@/components/admin/EventForm/Stepts/EventTypeStep';
import { SeatingMapEditor } from '@/components/admin/EventForm/Stepts/SeatingMap/SeatingMapEditor';
import { GeneralTicketsStep } from '@/components/admin/EventForm/Stepts/GeneralTicketsStep';
import { ReviewStep } from '@/components/admin/EventForm/Stepts/ReviewStep';
import { StepIndicator } from '@/components/events/StepIndicator';
import {
  type StepKey,
  type EventFormData,
  type SeatingChart,
  type GeneralTicket
} from '@/types/event';

const INITIAL_SEATING_CHART: SeatingChart = {
  rows: 18,
  columns: 12,
  sections: [
    {
      id: 'regular',
      name: 'Regular',
      type: 'REGULAR',
      price: 1000,
      rowStart: 1,
      rowEnd: 14,
      columnStart: 1,
      columnEnd: 12,
      color: '#3B82F6'
    },
    {
      id: 'vip',
      name: 'VIP',
      type: 'VIP',
      price: 2000,
      rowStart: 15,
      rowEnd: 18,
      columnStart: 1,
      columnEnd: 12,
      color: '#EF4444'
    }
  ],
  customLayout: false
};

const INITIAL_FORM_DATA: EventFormData = {
  name: '',
  description: '',
  date: '',
  location: '',
  imageUrl: '',
  eventType: 'SEATED',
  seatingChart: INITIAL_SEATING_CHART,
  generalTickets: []
};

const STEPS: Record<StepKey, { title: string; description: string }> = {
  info: {
    title: 'Información Básica',
    description: 'Detalles generales del evento'
  },
  type: {
    title: 'Tipo de Evento',
    description: 'Selecciona el formato del evento'
  },
  tickets: {
    title: 'Configuración de Entradas',
    description: 'Define los tipos de entradas y precios'
  },
  review: {
    title: 'Revisar y Crear',
    description: 'Verifica la información antes de crear'
  }
};

export default function NewEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepKey>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM_DATA);

  const handleBasicInfoChange = (updates: Partial<EventFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleEventTypeChange = (eventType: 'SEATED' | 'GENERAL') => {
    setFormData(prev => ({
      ...prev,
      eventType,
      seatingChart: eventType === 'SEATED' ? INITIAL_SEATING_CHART : undefined,
      generalTickets: eventType === 'GENERAL' ? [] : undefined
    }));
  };

  const handleSeatingChartChange = (seatingChart: SeatingChart) => {
    setFormData(prev => ({ ...prev, seatingChart }));
  };

  const handleGeneralTicketsChange = (tickets: GeneralTicket[]) => {
    setFormData(prev => ({ ...prev, generalTickets: tickets }));
  };

  const validateSeatingConfiguration = (): boolean => {
    if (!formData.seatingChart) return true;
    const { sections, rows, columns } = formData.seatingChart;

    if (rows < 1 || rows > 50 || columns < 1 || columns > 50) return false;

    return sections.every(section => (
      section.rowStart >= 1 &&
      section.rowEnd <= rows &&
      section.columnStart >= 1 &&
      section.columnEnd <= columns &&
      section.price > 0
    ));
  };

  const validateStep = (step: StepKey): boolean => {
    switch (step) {
      case 'info':
        return Boolean(
          formData.name &&
          formData.description &&
          formData.date &&
          formData.location
        );
      case 'type':
        return Boolean(formData.eventType);
      case 'tickets':
        return formData.eventType === 'SEATED'
          ? validateSeatingConfiguration()
          : Boolean(formData.generalTickets?.length);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!validateSeatingConfiguration()) {
        throw new Error('La configuración de asientos no es válida');
      }

      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const eventData = {
        ...formData,
        imageUrl,
        date: new Date(formData.date).toISOString()
      };

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el evento');
      }

      router.push('/admin/events');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'info':
        return (
          <>
            <BasicInfoStep
              data={formData}
              onChange={handleBasicInfoChange}
            />
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Imagen del Evento</h3>
              <ImageUpload
                onImageUpload={setImageFile}
                currentImageUrl={formData.imageUrl}
                className="w-full max-w-xl mx-auto"
              />
            </div>
          </>
        );
      case 'type':
        return (
          <EventTypeStep
            selectedType={formData.eventType}
            onSelect={handleEventTypeChange}
          />
        );
      case 'tickets':
        return formData.eventType === 'SEATED' ? (
          <div className="h-[600px]">
            <SeatingMapEditor
              initialSections={formData.seatingChart?.sections ?? []}
              onChange={handleSeatingChartChange}
            />
          </div>
        ) : (
          <GeneralTicketsStep
            tickets={formData.generalTickets ?? []}
            onChange={handleGeneralTicketsChange}
          />
        );
      case 'review':
        return (
          <ReviewStep
            data={formData}
            onEdit={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

  const moveToStep = (direction: 'next' | 'prev') => {
    const stepArray: StepKey[] = Object.keys(STEPS) as StepKey[];
    const currentIndex = stepArray.indexOf(currentStep);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < stepArray.length) {
      setCurrentStep(stepArray[newIndex]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Evento</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {STEPS[currentStep].title}
        </h2>
        {renderStepContent()}
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => moveToStep('prev')}
          disabled={currentStep === 'info'}
        >
          Atrás
        </Button>

        <Button
          onClick={() => {
            if (!validateStep(currentStep)) {
              alert('Por favor completa todos los campos requeridos');
              return;
            }

            if (currentStep === 'review') {
              handleSubmit();
            } else {
              moveToStep('next');
            }
          }}
          disabled={isSubmitting}
        >
          {currentStep === 'review' ? 'Crear Evento' : 'Siguiente'}
        </Button>
      </div>
    </div>
  );
}