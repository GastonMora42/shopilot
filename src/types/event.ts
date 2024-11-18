// types/event.ts
export type StepKey = 'info' | 'type' | 'tickets' | 'review';

export interface Seat {
  id: string;
  row: number;
  column: number;
  sectionId: string;
  label: string;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
}

export interface Section {
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

export interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  eventType: 'SEATED' | 'GENERAL';
  seatingChart?: SeatingChart;
  generalTickets?: GeneralTicket[];
}

// components/events/steps/SeatingMap/SeatingMapEditor.tsx
interface SeatingMapEditorProps {
  initialSections: Section[];
  onChange: (seatingChart: SeatingChart) => void;
}

// components/events/steps/ReviewStep.tsx
interface ReviewStepProps {
  data: EventFormData;
  onEdit: (step: StepKey) => void;
}