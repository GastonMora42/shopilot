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
import { ImageUpload } from '@/components/ui/ImageUpload';

type StepType = 'info' | 'seating' | 'pricing' | 'review';

interface Seating {
  rows: number;
  columns: number;
}

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
          rowStart: 1,
          rowEnd: 7,
          columnStart: 1,
          columnEnd: 10
        },
        {
          name: 'VIP',
          type: 'VIP' as const,
          price: 2000,
          rowStart: 8,
          rowEnd: 10,
          columnStart: 1,
          columnEnd: 10
        }
      ]
    },
    orderTotal: 3000,
    imageUrl: ''
  });

  const handleBasicInfoChange = (info: unknown) => {
    if (typeof info === "object" && info !== null) {
      setEventData(prev => ({ ...prev, ...info }));
    } else {
      console.error("Invalid info format");
    }
  };

  const handleSeatingChange = (seating: unknown) => {
    if (typeof seating === "object" && seating !== null && "rows" in seating && "columns" in seating) {
      const validSeating = seating as Seating;
      setEventData(prev => {
        // Ajustar las secciones existentes si es necesario
        const adjustedSections = prev.seatingChart.sections.map(section => ({
          ...section,
          rowEnd: Math.min(section.rowEnd, validSeating.rows),
          columnEnd: Math.min(section.columnEnd, validSeating.columns)
        }));
  
        return {
          ...prev,
          seatingChart: {
            ...prev.seatingChart,
            rows: validSeating.rows,
            columns: validSeating.columns,
            sections: adjustedSections
          }
        };
      });
    } else {
      console.error("Invalid seating format");
    }
  };
  
  const handleSectionsChange = (sections: unknown) => {
    if (Array.isArray(sections)) {
      // Validar que todas las secciones tengan el formato correcto
      const validSections = sections.map(section => ({
        ...section,
        rowStart: Math.max(1, section.rowStart),
        columnStart: Math.max(1, section.columnStart),
        rowEnd: Math.min(section.rowEnd, eventData.seatingChart.rows),
        columnEnd: Math.min(section.columnEnd, eventData.seatingChart.columns)
      }));
  
      setEventData(prev => ({
        ...prev,
        seatingChart: {
          ...prev.seatingChart,
          sections: validSections,
        },
      }));
    } else {
      console.error("Invalid sections format");
    }
  };

// En NewEventPage, fuera de handleSubmit
const handleImageUpload = async (file: File) => {
  try {
    console.log('Starting client-side upload...');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Upload response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Error al subir la imagen');
    }

    setEventData(prev => ({
      ...prev,
      imageUrl: data.url
    }));
    
    return data.url;
  } catch (error) {
    console.error('Client-side upload error:', error);
    throw error;
  }
};

// Modifica el handleSubmit para que use la función handleImageUpload
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);

    // Validar secciones...
    if (invalidSections.length > 0) {
      throw new Error('Hay secciones con límites inválidos');
    }

    let imageUrl = eventData.imageUrl;
    
    // Subir imagen si existe
    if (imageFile) {
      try {
        imageUrl = await handleImageUpload(imageFile);
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        throw new Error('Error al subir la imagen');
      }
    }

    const formattedData = {
      ...eventData,
      imageUrl, // Usar la URL de la imagen subida
      date: new Date(eventData.date).toISOString()
    };

    const response = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    const eventCreationData = await response.json();

    if (!response.ok) {
      throw new Error(eventCreationData.error || 'Error al crear el evento');
    }

    alert('¡Evento creado exitosamente!');
    router.push(`/events/${eventCreationData._id}`);
  } catch (error) {
    console.error('Error:', error);
    alert(error instanceof Error ? error.message : 'Ocurrió un error al crear el evento');
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

  const invalidSections = eventData.seatingChart.sections.filter(section => 
    section.rowStart < 1 || 
    section.columnStart < 1 ||
    section.rowEnd > eventData.seatingChart.rows ||
    section.columnEnd > eventData.seatingChart.columns
  );

  if (invalidSections.length > 0) {
    return { 
      isValid: false, 
      message: 'Hay secciones con límites inválidos' 
    };
  }

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

        <div>
        <div className="mb-6">
  <h3 className="text-lg font-semibold mb-2">Imagen del Evento</h3>
  <ImageUpload
    onImageUpload={(file) => setImageFile(file)}
    currentImageUrl={eventData.imageUrl}
    className="w-full max-w-xl mx-auto"
  />
</div>
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
            disabled={isSubmitting}
          >
            {step === 'review' ? 'Crear Evento' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
}