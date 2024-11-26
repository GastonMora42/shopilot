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
import {
  type StepKey,
  type EventFormData,
  type SeatingChart,
  type GeneralTicket,
  Section,
  Seat
} from '@/types/event';
import { SeatStatus } from '@/types';
import { EditorSeat, EditorSection } from '@/types/editor';

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
  customLayout: false,
  seats: []
};

const INITIAL_FORM_DATA: EventFormData = {
  name: '',
  description: '',
  date: '',
  location: '',
  imageUrl: '',
  eventType: 'SEATED',
  seatingChart: INITIAL_SEATING_CHART,
  generalTickets: [],
  seating: undefined
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
  },
  BASIC_INFO: {
    title: '',
    description: ''
  },
  EVENT_TYPE: {
    title: '',
    description: ''
  },
  TICKETS: {
    title: '',
    description: ''
  },
  REVIEW: {
    title: '',
    description: ''
  }
};

const showError = (message: string) => {
  alert(message);
};

const showSuccess = () => {
  alert('Evento creado exitosamente');
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

  const handleGeneralTicketsChange = (tickets: GeneralTicket[]) => {
    setFormData(prev => ({ ...prev, generalTickets: tickets }));
  };

  const handleSeatingChartChange = (layout: { 
    seats: EditorSeat[]; 
    sections: EditorSection[]; 
    rows: number; 
    columns: number; 
  }) => {
    // Convertimos los asientos del editor al formato que necesitamos
    const convertedSeats = layout.seats.map(seat => ({
      ...seat,
      label: seat.label || `R${seat.row}C${seat.column}`,
      status: seat.status === 'ACTIVE' ? 'AVAILABLE' as const : 'DISABLED' as const,
      eventId: '', // Se asignará cuando se cree el evento
      price: layout.sections.find(s => s.id === seat.sectionId)?.price || 0,
      type: layout.sections.find(s => s.id === seat.sectionId)?.type || 'REGULAR'
    }));
  
    const convertedSections = layout.sections.map(section => ({
      ...section,
      rowStart: section.rowStart || 1,
      rowEnd: section.rowEnd || layout.rows,
      columnStart: section.columnStart || 1,
      columnEnd: section.columnEnd || layout.columns
    }));
  
    setFormData(prev => ({
      ...prev,
      seatingChart: {
        rows: layout.rows,
        columns: layout.columns,
        seats: convertedSeats,
        sections: convertedSections,
        customLayout: prev.seatingChart?.customLayout ?? false
      }
    }));
  };
  

  const validateSeatingConfiguration = (): boolean => {
    if (!formData.seatingChart) return false;
    const { sections, rows, columns, seats } = formData.seatingChart;

    // Validar dimensiones básicas
    if (rows < 1 || rows > 50 || columns < 1 || columns > 50) {
      showError('Las dimensiones del mapa de asientos son inválidas');
      return false;
    }

    // Validar secciones
    if (!sections.length) {
      showError('Debe definir al menos una sección');
      return false;
    }
    
    const sectionsValid = sections.every(section => (
      section.rowStart >= 1 &&
      section.rowEnd <= rows &&
      section.columnStart >= 1 &&
      section.columnEnd <= columns &&
      section.price > 0 &&
      section.name.trim() !== '' &&
      ['REGULAR', 'VIP', 'DISABLED'].includes(section.type)
    ));

    if (!sectionsValid) {
      showError('Hay secciones con configuración inválida');
      return false;
    }

    // Si es layout personalizado, validar asientos
    if (formData.seatingChart.customLayout) {
      if (!seats.length) {
        showError('Debe definir al menos un asiento para layout personalizado');
        return false;
      }
      
      const seatsValid = seats.every(seat => (
        seat.row >= 0 &&
        seat.row < rows &&
        seat.column >= 0 &&
        seat.column < columns &&
        seat.sectionId &&
        sections.some(s => s.id === seat.sectionId)
      ));

      if (!seatsValid) {
        showError('Hay asientos con configuración inválida');
        return false;
      }
    }

    return true;
  };

  const validateGeneralTickets = (): boolean => {
    if (!formData.generalTickets?.length) {
      showError('Debe definir al menos un tipo de entrada');
      return false;
    }

    const ticketsValid = formData.generalTickets.every(ticket => 
      ticket.name.trim() !== '' && 
      Number(ticket.price) > 0 && 
      Number(ticket.quantity) > 0
    );

    if (!ticketsValid) {
      showError('Hay tipos de entrada con configuración inválida');
      return false;
    }

    return true;
  };

  const validateBasicInfo = (): boolean => {
    if (!formData.name.trim()) {
      showError('El nombre del evento es requerido');
      return false;
    }
    if (!formData.description.trim()) {
      showError('La descripción es requerida');
      return false;
    }
    if (!formData.date) {
      showError('La fecha es requerida');
      return false;
    }
    if (new Date(formData.date) < new Date()) {
      showError('La fecha debe ser futura');
      return false;
    }
    if (!formData.location.trim()) {
      showError('La ubicación es requerida');
      return false;
    }
    return true;
  };

  const validateStep = (step: StepKey): boolean => {
    switch (step) {
      case 'info':
        return validateBasicInfo();
      case 'type':
        return Boolean(formData.eventType);
      case 'tickets':
        return formData.eventType === 'SEATED'
          ? validateSeatingConfiguration()
          : validateGeneralTickets();
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validación final antes de enviar
      if (!validateBasicInfo()) return;
      
      if (formData.eventType === 'SEATED' && !validateSeatingConfiguration()) {
        return;
      }

      if (formData.eventType === 'GENERAL' && !validateGeneralTickets()) {
        return;
      }

      // Procesar imagen si existe
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

      // Preparar datos del evento
      const eventData = {
        name: formData.name,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        imageUrl,
        eventType: formData.eventType,
        ...(formData.eventType === 'SEATED' ? {
          seatingChart: {
            rows: formData.seatingChart!.rows,
            columns: formData.seatingChart!.columns,
            sections: formData.seatingChart!.sections.map(section => ({
              ...section,
              price: Number(section.price)
            })),
            customLayout: formData.seatingChart!.customLayout,
            seats: formData.seatingChart!.seats.map(seat => ({
              ...seat,
              row: Number(seat.row),
              column: Number(seat.column),
              status: 'AVAILABLE'
            }))
          }
        } : {
          generalTickets: formData.generalTickets!.map(ticket => ({
            ...ticket,
            price: Number(ticket.price),
            quantity: Number(ticket.quantity)
          }))
        })
      };

      // Enviar datos a la API
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el evento');
      }

      const result = await response.json();
      
      if (result.success) {
        showSuccess();
        router.push('/admin/events');
      } else {
        throw new Error(result.error || 'Error desconocido al crear el evento');
      }

    } catch (error) {
      console.error('Error:', error);
      showError(error instanceof Error ? error.message : 'Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
  initialSeats={formData.seatingChart?.seats.map(seat => ({
    id: seat.id,
    row: seat.row,
    column: seat.column,
    sectionId: seat.sectionId,
    status: seat.status === 'AVAILABLE' ? 'ACTIVE' : 'DISABLED',
    label: seat.label,
    position: seat.position,
    screenPosition: seat.position || { // Agregamos screenPosition
      x: seat.column * 30, // Usando GRID_SIZE o un valor fijo
      y: seat.row * 30
    }
  })) ?? []}
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
        return (
          <>
            <BasicInfoStep
              data={{
                name: formData.name,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                imageUrl: formData.imageUrl
              }}
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
    }
  };

  const moveToStep = (direction: 'next' | 'prev') => {
    const stepArray: StepKey[] = ['info', 'type', 'tickets', 'review'];
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
        <p className="text-gray-600 mb-6">
          {STEPS[currentStep].description}
        </p>
        {renderStepContent()}
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => moveToStep('prev')}
          disabled={currentStep === 'info' || isSubmitting}
        >
          Atrás
        </Button>

        <Button
onClick={() => {
  if (!validateStep(currentStep)) {
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
{isSubmitting 
  ? 'Procesando...' 
  : currentStep === 'review' 
    ? 'Crear Evento' 
    : 'Siguiente'
}
</Button>
</div>

{/* Indicador de progreso */}
<div className="mt-6">
<div className="flex justify-between mb-2">
{['info', 'type', 'tickets', 'review'].map((step, index) => (
  <div
    key={step}
    className={`flex items-center ${
      index < ['info', 'type', 'tickets', 'review'].indexOf(currentStep)
        ? 'text-blue-600'
        : index === ['info', 'type', 'tickets', 'review'].indexOf(currentStep)
        ? 'text-blue-600 font-bold'
        : 'text-gray-400'
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
        index <= ['info', 'type', 'tickets', 'review'].indexOf(currentStep)
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-300'
      }`}
    >
      {index + 1}
    </div>
    <div className="ml-2">{STEPS[step as StepKey].title}</div>
  </div>
))}
</div>
<div className="relative h-2 bg-gray-200 rounded-full">
<div
  className="absolute h-full bg-blue-600 rounded-full transition-all duration-300"
  style={{
    width: `${
      ((['info', 'type', 'tickets', 'review'].indexOf(currentStep) + 1) / 4) * 100
    }%`
  }}
/>
</div>
</div>

{/* Toast o notificaciones */}
{isSubmitting && (
<div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
Creando evento...
</div>
)}
</div>
);
}