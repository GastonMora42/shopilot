// types/editor.ts
import { Section } from "@/components/admin/EventForm/Stepts/SeatedTickets/types";

export interface Point {
  x: number;
  y: number;
}

export type SeatStatus = 'ACTIVE' | 'DISABLED';
export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';

export interface EditorSeat {
  id: string;
  row: number;
  column: number;
  sectionId: string;
  status: SeatStatus;
  position: Point;
  label: string;
  screenPosition: Point;  // Asegúrate que no sea opcional (sin ?)
}

export interface EditorSection extends Section {
  id: string;
  name: string;
  type: SectionType;
  color: string;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
}

export interface TemplateParams {
  totalRows: number;
  seatsPerRow: number;
  aislePositions?: number[];
  sectionConfigs: {
    id: string;
    name: string;
    type: SectionType;
    color: string;
    price: number;
    rowRange: [number, number];
  }[];
}

export interface LayoutConfig {
  rows: number
  columns: number
  seats: EditorSeat[];
  sections: EditorSection[];
}

export interface LayoutTemplate {
  seats: any;
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: EditorSection[];
  generateLayout: (params: TemplateParams) => LayoutConfig;
}

export interface SeatingStepData extends LayoutConfig {
  seats: EditorSeat[];
  sections: EditorSection[];
}

export interface SeatingMapEditorProps {
  initialSections: EditorSection[];
  initialSeats: EditorSeat[];
  onChange: (layout: LayoutConfig) => void;
  onSave?: () => Promise<void>;
}

export interface ViewportBounds {
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface DragState {
  start: Point | null;
  current: Point | null;
  mode: 'SELECT' | 'PAN' | 'DRAW' | null;
}

// Estado del editor
export interface EditorState {
  seats: EditorSeat[];
  sections: EditorSection[];
  selectedSeats: string[];
  zoom: number;
  pan: Point;
  tool: 'SELECT' | 'DRAW' | 'ERASE';
  activeSectionId: string | null;
}

export interface EditorActions {
  setTool: (tool: EditorState['tool']) => void;
  setActiveSection: (sectionId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setSections: (sections: EditorSection[]) => void;
  updateSeats: (seats: EditorSeat[]) => void;
}

export interface TemplateSelectorProps {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    sections: EditorSection[];
  }>;
  onSelect: (templateId: string) => void;
  onCustomLayout: () => void;
}