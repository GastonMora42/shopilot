'use client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BasicInfoStep } from '@/components/admin/EventForm/Stepts/BasicInfoStep';
import { EventTypeStep } from '@/components/admin/EventForm/Stepts/EventTypeStep';
import { SeatingMapEditor } from '@/components/admin/EventForm/Stepts/SeatingMap/SeatingMapEditor';
import { GeneralTicketsStep } from '@/components/admin/EventForm/Stepts/GeneralTicketsStep';
import { ReviewStep } from '@/components/admin/EventForm/Stepts/ReviewStep';
import { Layout, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Seat, 
  Section, 
  SeatStatus, 
  SeatType 
} from '@/types/index';  // Importa desde index.ts
import type { 
  EditorSeat, 
  EditorSection 
} from '@/types/editor';
import type { 
  EventFormData, 
  GeneralTicket, 
  SeatingChart,
  StepKey
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
      color: '#3B82F6',
      published: false
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
      color: '#EF4444',
      published: false
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
  seating: undefined,
  published: false
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
    // Convertimos los asientos del editor al formato de Seat
    const convertedSeats: Seat[] = layout.seats.map(seat => ({
      _id: seat.id, // Aseguramos que tenga _id
      id: seat.id,
      eventId: '', // Se asignará cuando se cree el evento
      seatId: seat.label || `R${seat.row}C${seat.column}`,
      row: seat.row,
      column: seat.column,
      status: (seat.status === 'DISABLED' ? 'DISABLED' : 'AVAILABLE') as SeatStatus,
      type: layout.sections.find(s => s.id === seat.sectionId)?.type || 'REGULAR' as SeatType,
      price: layout.sections.find(s => s.id === seat.sectionId)?.price || 0,
      section: layout.sections.find(s => s.id === seat.sectionId)?.name || '',
      sectionId: seat.sectionId,
      label: seat.label || `R${seat.row}C${seat.column}`,
      position: seat.position || { x: 0, y: 0 },
      temporaryReservation: undefined,
      lastReservationAttempt: undefined
    }));
  
    // Convertimos las secciones asegurándonos que cumplan con el tipo Section
    const convertedSections: Section[] = layout.sections.map(section => ({
      id: section.id,
      name: section.name,
      type: section.type,
      price: section.price,
      rowStart: section.rowStart || 0,
      rowEnd: section.rowEnd || layout.rows - 1,
      columnStart: section.columnStart || 0,
      columnEnd: section.columnEnd || layout.columns - 1,
      color: section.color,
      published: false, // Valor por defecto
      capacity: (section.rowEnd - section.rowStart + 1) * (section.columnEnd - section.columnStart + 1)
    }));
  
    setFormData(prev => {
      const updatedData: EventFormData = {
        ...prev,
        seatingChart: {
          rows: layout.rows,
          columns: layout.columns,
          seats: convertedSeats,
          sections: convertedSections,
          customLayout: prev.seatingChart?.customLayout ?? false
        }
      };
      return updatedData;
    });
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
    status: seat.status === 'AVAILABLE' ? 'AVAILABLE' : 'DISABLED' as SeatStatus, // Cambiado de 'ACTIVE' a 'AVAILABLE'
    label: seat.label,
    position: seat.position,
    screenPosition: seat.position || {
      x: seat.column * 30,
      y: seat.row * 30
    },
    rotation: 0, // Agregamos las propiedades faltantes de EditorSeat
    properties: {
      isAisle: false,
      isHandicap: false,
      isReserved: false
    }
  })) ?? []}
  onChange={handleSeatingChartChange}
/>
            </div>
          ) : (
            <GeneralTicketsStep
            tickets={formData.generalTickets?.map(ticket => ({
              ...ticket,
              id: ticket.id || String(Date.now()) // Proporciona un id por defecto si es undefined
            })) ?? []}
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
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Evento</h1>
          <div className="h-10 w-px bg-gray-200"></div>
          <Layout className="h-8 w-8 text-[#0087ca]" />
        </div>
        <p className="text-gray-500 mt-2">
          {STEPS[currentStep].description}
        </p>
      </div>
 
      {/* Indicador de progreso */}
      <div className="hidden md:block">
        <div className="flex justify-between mb-4">
          {['info', 'type', 'tickets', 'review'].map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${
                index <= ['info', 'type', 'tickets', 'review'].indexOf(currentStep)
                  ? 'text-[#0087ca]'
                  : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= ['info', 'type', 'tickets', 'review'].indexOf(currentStep)
                    ? 'bg-[#0087ca] text-white'
                    : 'bg-gray-100'
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 hidden lg:block">{STEPS[step as StepKey].title}</span>
            </div>
          ))}
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute h-full bg-[#0087ca] rounded-full transition-all duration-300"
            style={{
              width: `${
                ((['info', 'type', 'tickets', 'review'].indexOf(currentStep) + 1) / 4) * 100
              }%`
            }}
          />
        </div>
      </div>
 
      <Card className="bg-gradient-to-br from-[#a5dcfd]/20 to-white">
        <div className="p-4 md:p-6">
          {renderStepContent()}
        </div>
      </Card>
 
      <div className="flex justify-between gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => moveToStep('prev')}
          disabled={currentStep === 'info' || isSubmitting}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
 
        <Button
          onClick={() => {
            if (!validateStep(currentStep)) return;
            if (currentStep === 'review') {
              handleSubmit();
            } else {
              moveToStep('next');
            }
          }}
          disabled={isSubmitting}
          className="bg-[#0087ca] hover:bg-[#0087ca]/90 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
              Procesando...
            </>
          ) : currentStep === 'review' ? (
            <>
              <Plus className="h-4 w-4" />
              Crear Evento
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
 
      {isSubmitting && (
        <div className="fixed bottom-4 right-4 bg-[#0087ca] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
          Creando evento...
        </div>
      )}
    </div>
  );
 }