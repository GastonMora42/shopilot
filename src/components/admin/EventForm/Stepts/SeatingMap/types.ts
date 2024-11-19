// components/admin/EventForm/steps/SeatingMap/types.ts
import { Section } from '@/types/event';
import { LayoutConfig } from "./types/layout";

export interface Point {
  x: number;
  y: number;
}

export interface Seat {
  id: string;
  row: number;
  column: number;
  position: Point;
  sectionId: string;
  label: string;
  status: 'ACTIVE' | 'DISABLED';
}

export interface EditorSection extends Section {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}

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

export type StepKey = 'BASIC_INFO' | 'EVENT_TYPE' | 'TICKETS' | 'REVIEW';

export interface EventFormData {
  location: string;
  date: string;
  name: string;
  description: string;
  imageUrl: string;
  seatingChart: {
    sections: EditorSection[];
    seats: Seat[];
    rows: number;
    columns: number;
  };
  basicInfo: {
    name: string;
    description: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
  eventType: 'SEATED' | 'GENERAL';
  seating: {
    sections: Array<{
      id: string;
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      price: number;
    }>;
  } | null;
  generalTickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
}

export interface SeatingMapEditorProps {
  initialSections: EditorSection[];
  initialSeats: Seat[];
  onSave?: () => Promise<void>;
  onChange: (layout: {
    seats: Seat[];
    sections: EditorSection[];
    rows: number;
    columns: number;
  }) => void;
}

export type { LayoutConfig, Section };