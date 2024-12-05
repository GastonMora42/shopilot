// components/admin/EventForm/index.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BasicInfoStep } from './EventForm/Stepts/BasicInfoStep';
import { EventTypeStep } from './EventForm/Stepts/EventTypeStep';
import { SeatingStep } from './EventForm/Stepts/SeatingStep';
import { GeneralTicketsStep } from './EventForm/Stepts/GeneralTicketsStep';
import { ReviewStep } from './EventForm/Stepts/ReviewStep';
import { LayoutConfig } from '@/types/editor';

// Definición de tipos
interface EventFormData {
  basicInfo: {
    name: string;
    description: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
  eventType: 'SEATED' | 'GENERAL';
  seating: LayoutConfig | null;
  generalTickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
}

const steps = {
  BASIC_INFO: 'BASIC_INFO',
  EVENT_TYPE: 'EVENT_TYPE',
  TICKETS: 'TICKETS',
  REVIEW: 'REVIEW'
} as const;

type StepKey = keyof typeof steps;

interface StepConfig {
  key: StepKey;
  label: string;
  description: string;
}

const STEP_CONFIG: StepConfig[] = [
  {
    key: 'BASIC_INFO',
    label: 'Información Básica',
    description: 'Detalles generales del evento'
  },
  {
    key: 'EVENT_TYPE',
    label: 'Tipo de Evento',
    description: 'Configura el formato del evento'
  },
  {
    key: 'TICKETS',
    label: 'Entradas',
    description: 'Configura los tipos de entradas'
  },
  {
    key: 'REVIEW',
    label: 'Revisión',
    description: 'Verifica la información'
  }
];

export const EventForm: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey>('BASIC_INFO');
  const [formData, setFormData] = useState<EventFormData>({
    basicInfo: {
      name: '',
      description: '',
      date: '',
      location: '',
      imageUrl: ''
    },
    eventType: 'GENERAL',
    seating: null,
    generalTickets: []
  });

  const handleBasicInfoChange = (updates: Partial<EventFormData['basicInfo']>) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...updates }
    }));
  };

  const handleEventTypeChange = (type: 'SEATED' | 'GENERAL') => {
    setFormData(prev => ({
      ...prev,
      eventType: type,
      seating: type === 'GENERAL' ? null : prev.seating,
      generalTickets: type === 'SEATED' ? [] : prev.generalTickets
    }));
  };

  const handleSeatingChange = (layout: LayoutConfig) => {
    setFormData(prev => ({
      ...prev,
      seating: layout
    }));
  };

  const handleGeneralTicketsChange = (tickets: EventFormData['generalTickets']) => {
    setFormData(prev => ({
      ...prev,
      generalTickets: tickets
    }));
  };

  const handleNext = () => {
    const currentIndex = STEP_CONFIG.findIndex(step => step.key === currentStep);
    if (currentIndex < STEP_CONFIG.length - 1) {
      setCurrentStep(STEP_CONFIG[currentIndex + 1].key);
    }
  };

  const handleBack = () => {
    const currentIndex = STEP_CONFIG.findIndex(step => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_CONFIG[currentIndex - 1].key);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'BASIC_INFO':
        return (
          !!formData.basicInfo.name &&
          !!formData.basicInfo.description &&
          !!formData.basicInfo.date &&
          !!formData.basicInfo.location
        );
      case 'EVENT_TYPE':
        return !!formData.eventType;
      case 'TICKETS':
        return formData.eventType === 'SEATED'
          ? !!formData.seating && formData.seating.sections.length > 0
          : formData.generalTickets.length > 0;
      case 'REVIEW':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const eventData = {
        ...formData.basicInfo,
        eventType: formData.eventType,
        ...(formData.eventType === 'SEATED'
          ? { seating: formData.seating }
          : { tickets: formData.generalTickets })
      };

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el evento');
      }

      const event = await response.json();
      router.push(`/admin/events/${event._id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el evento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEP_CONFIG.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center ${
                index < STEP_CONFIG.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
                    ${
                      STEP_CONFIG.findIndex(s => s.key === currentStep) >= index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                >
                  <span
                    className={`text-sm font-medium
                      ${
                        STEP_CONFIG.findIndex(s => s.key === currentStep) >= index
                          ? 'text-blue-500'
                          : 'text-gray-500'
                      }`}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="absolute -bottom-6 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-600">
                    {step.label}
                  </span>
                </div>
              </div>
              {index < STEP_CONFIG.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    STEP_CONFIG.findIndex(s => s.key === currentStep) > index
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'BASIC_INFO' && (
              <BasicInfoStep
                data={formData.basicInfo}
                onChange={handleBasicInfoChange}
              />
            )}

            {currentStep === 'EVENT_TYPE' && (
              <EventTypeStep
                selectedType={formData.eventType}
                onSelect={handleEventTypeChange}
              />
            )}

            {currentStep === 'TICKETS' && formData.eventType === 'SEATED' && (
              <SeatingStep
                initialLayout={formData.seating || undefined}
                onChange={handleSeatingChange}
                onSave={async () => {
                  // Implementar guardado temporal si es necesario
                }}
              />
            )}

            {currentStep === 'TICKETS' && formData.eventType === 'GENERAL' && (
              <GeneralTicketsStep
                tickets={formData.generalTickets}
                onChange={handleGeneralTicketsChange}
              />
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 'BASIC_INFO'}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>

        {currentStep === 'REVIEW' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !validateCurrentStep()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear Evento'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!validateCurrentStep()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
};