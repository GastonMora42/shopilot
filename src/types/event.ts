// types/event.ts

// Tipos básicos
export type StepKey = 'info' | 'type' | 'tickets' | 'review' | 'BASIC_INFO' | 'EVENT_TYPE' | 'TICKETS' | 'REVIEW';
export type EventType = 'SEATED' | 'GENERAL';
export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'ACTIVE' | 'DISABLED';

export interface Point {
  x: number;
  y: number;
}

export interface Seat {
  id: string;
  eventId: string; // Añadimos esta propiedad
  row: number;
  column: number;
  sectionId: string;
  status: SeatStatus;
  position: Point;
  label: string;
  price: number;
  type: SectionType;
}

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
  capacity?: number;
}

// ... resto del archivo igual ...
export interface SeatingChart {
  rows: number;
  columns: number;
  sections: Section[];
  seats: Seat[];
  customLayout?: boolean;
}

export interface GeneralTicket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

// Interfaces para los formularios
export interface EventFormData {
  seating: { sections: Section[]; } | null | undefined;
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  eventType: EventType;
  seatingChart?: SeatingChart;
  generalTickets?: GeneralTicket[];
}

// Props de los componentes
export interface SeatingMapEditorProps {
  initialSections: Section[];
  initialSeats?: Seat[];
  onChange: (seatingChart: SeatingChart) => void;
}

export interface ReviewStepProps {
  data: EventFormData;
  onEdit: (step: StepKey) => void;
}

export interface BasicInfoStepProps {
  data: {
    name: string;
    description: string;
    date: string;
    location: string;
    imageUrl: string;
  };
  onChange: (data: Partial<EventFormData>) => void;
}

export interface EventTypeStepProps {
  selectedType: EventType;
  onSelect: (type: EventType) => void;
}

export interface GeneralTicketsStepProps {
  tickets: GeneralTicket[];
  onChange: (tickets: GeneralTicket[]) => void;
}

// Interfaces para el editor de asientos
export interface EditorState {
  seats: Seat[];
  selectedSeats: string[];
  zoom: number;
  pan: Point;
  tool: 'SELECT' | 'DRAW' | 'ERASE';
  activeSectionId: string | null;
}

export interface ViewportBounds {
  width: number;
  height: number;
  minZoom: number;
  maxZoom: number;
}

// Interfaces para los pasos del formulario
export interface StepConfig {
  key: StepKey;
  title: string;
  description: string;
}

export interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: StepKey;
}

export interface EditorSection {
  id: string;
  name: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}
