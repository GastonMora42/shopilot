// types/event.ts
import { SeatingChart, SeatType } from ".";
import { Seat } from "./seating";

// Tipos básicos
export type StepKey = 'info' | 'type' | 'tickets' | 'payment' | 'review' | 'BASIC_INFO' | 'EVENT_TYPE' | 'TICKETS' | 'PAYMENT' | 'REVIEW';
export type EventType = 'SEATED' | 'GENERAL';
export type PaymentMethod = 'MERCADOPAGO' | 'BANK_TRANSFER';
export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'ACTIVE' | 'DISABLED';

// Interfaces base
export interface Point {
  x: number;
  y: number;
}

// Interfaces para datos bancarios
export interface BankAccountData {
  accountName: string;
  cbu: string;
  bank: string;
  additionalNotes?: string;
}

// Interfaces para MercadoPago
export interface MercadoPagoData {
  accessToken: string;
  userId: string;
}

// Interfaces para tickets
export interface GeneralTicket {
  _id?: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  availableQuantity?: number;
  maxPerPurchase?: number;
}

export interface SelectedGeneralTicket {
  ticketType: any;
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
  capacity: number;
  availableSeats?: number;
}

// Interfaces para compras
export interface TicketPurchase {
  eventId: string;
  type: EventType;
  seated?: {
    seats: string[];
  };
  general?: {
    tickets: SelectedGeneralTicket[];
  };
  totalAmount: number;
}

export interface TicketSelectionState {
  eventType: EventType;
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  totalAmount: number;
}

// Props para componentes
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

// Interfaces para formularios
export interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  eventType: EventType;
  paymentMethod: PaymentMethod;
  bankAccountData?: BankAccountData;
  published: boolean;
  seatingChart?: SeatingChart;
  generalTickets?: GeneralTicket[];
  seating?: {
    sections: Section[];
  } | null;
}

export interface PaymentMethodStepProps {
  paymentMethod: PaymentMethod;
  bankAccountData?: BankAccountData;
  onChange: (data: { 
    paymentMethod: PaymentMethod, 
    bankAccountData?: BankAccountData
  }) => void;
  hasMercadoPagoLinked: boolean;
  hasBankAccountConfigured: boolean;
}

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

// Interfaces para editor
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
  type: SectionType;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}

// Interfaces de evento base y tipos
interface IBaseEvent {
  _id: string;
  name: string;
  description: string;
  slug: string;
  date: Date;
  endDate: Date; 
  location: string;
  imageUrl?: string;
  eventType: EventType;
  paymentMethod: PaymentMethod;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  maxTicketsPerPurchase: number;
  organizerId: string;
  published: boolean;
  mercadopago?: MercadoPagoData;
  bankAccountData?: BankAccountData;
}

interface IGeneralEvent extends IBaseEvent {
  eventType: 'GENERAL';
  generalTickets: Array<{
    _id: string;
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
    published: boolean;
  }>;
}

interface ISeatedEvent extends IBaseEvent {
  eventType: 'SEATED';
  seatingChart: {
    rows: number;
    columns: number;
    sections: Array<{
      id: string;
      name: string;
      type: SectionType;
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
      color: string;
      published: boolean;
    }>;
    seats?: Array<{
      label: string;
      status: SeatStatus;
      eventId: string;
      price: number;
      type: SeatType;
      id: string;
      row: number;
      column: number;
      sectionId: string;
    }>;
  };
}

export type IEvent = IGeneralEvent | ISeatedEvent;
export type { SeatingChart, ISeatedEvent, IGeneralEvent };