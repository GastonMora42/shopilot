// types/event.ts

import { SeatingChart } from ".";
import { Seat } from "./seating";

// Tipos básicos (mantenemos los existentes)
export type StepKey = 'info' | 'type' | 'tickets' | 'review' | 'BASIC_INFO' | 'EVENT_TYPE' | 'TICKETS' | 'REVIEW';
export type EventType = 'SEATED' | 'GENERAL';
export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'ACTIVE' | 'DISABLED';

// Interfaces base
export interface Point {
  x: number;
  y: number;
}

// Interfaces para tickets generales
export interface GeneralTicket {
  _id: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  availableQuantity?: number; // Cantidad disponible para venta
  maxPerPurchase?: number;    // Máximo por compra
}

export interface SelectedGeneralTicket {
  ticketId: string;
  quantity: number;
  price: number;
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
  capacity: number;     // Hacemos capacity requerido
  availableSeats?: number; // Asientos disponibles
}

// Interfaces para compra de tickets
export interface TicketPurchase {
  eventId: string;
  type: EventType;
  seated?: {
    seats: string[];  // IDs de asientos seleccionados
  };
  general?: {
    tickets: SelectedGeneralTicket[];
  };
  totalAmount: number;
}

// Interfaces para el estado de selección
export interface TicketSelectionState {
  eventType: EventType;
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  totalAmount: number;
}

// Props para componentes de tickets
export interface TicketDisplayProps {
  event: Event;
  seats?: Seat[];
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  onSeatSelect: (seat: Seat) => void;
  onTicketSelect: (ticketId: string, quantity: number) => void;
  maxTicketsPerPurchase?: number;
  isLoading?: boolean;
  error?: string;
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

interface BaseEvent {
  _id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  imageUrl?: string;
  eventType: EventType;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  maxTicketsPerPurchase: number;
}

export interface SeatedEvent extends BaseEvent {
  eventType: 'SEATED';
  seatingChart: SeatingChart;
}

export interface GeneralEvent extends BaseEvent {
  eventType: 'GENERAL';
  generalTickets: GeneralTicket[];
}

export type Event = SeatedEvent | GeneralEvent;
// Modifica la interfaz IEvent para incluir los campos faltantes
interface IBaseEvent {
  _id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  imageUrl?: string;
  eventType: 'SEATED' | 'GENERAL';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  maxTicketsPerPurchase: number;
}

interface IGeneralEvent extends IBaseEvent {
  eventType: 'GENERAL';
  generalTickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
}

interface ISeatedEvent extends IBaseEvent {
  eventType: 'SEATED';
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
  };
}

export type IEvent = IGeneralEvent | ISeatedEvent;