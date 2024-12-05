import { EditorSeat } from "@/types/event";

// Tipos básicos
export type StepKey = 'info' | 'type' | 'tickets' | 'review';
export type Tool = 'SELECT' | 'DRAW' | 'ERASE';
export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';
export type SeatStatus = 'ACTIVE' | 'DISABLED';

// Interfaces base
export interface Point {
  x: number;
  y: number;
}

export interface Seat {
  id: string;
  row: number;
  column: number;
  sectionId: string;
  status: SeatStatus;
  position: Point;
  label: string;
  screenPosition?: Point;
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

// Estado del editor
// types.ts
export interface EditorState {
  seats: EditorSeat[];
  sections: EditorSection[]; // Agregamos esto
  selectedSeats: string[];
  zoom: number;
  pan: Point;
  tool: 'SELECT' | 'DRAW' | 'ERASE';
  activeSectionId: string | null;
}

// Props de componentes
export interface EditorCanvasProps {
  state: EditorState;
  bounds: ViewportBounds;
  onSeatAdd: (seat: Omit<Seat, 'id'>) => void;
  onSeatSelect: (seatIds: string[]) => void;
  onSeatsUpdate: (updates: Partial<Seat>, seatIds?: string[]) => void;
  onSectionSelect?: (sectionId: string) => void;
}

export interface SeatComponentProps {
  seat: Seat & { screenPosition: Point };
  selected: boolean;
  tool: Tool;
  sectionColor?: string;
}

export interface ViewportBounds {
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
}

// Estado de arrastre
export interface DragState {
  start: Point | null;
  current: Point | null;
  mode: 'SELECT' | 'PAN' | 'DRAW' | null;
}

// Props adicionales
export interface SeatingMapEditorProps {
  initialSections: EditorSection[];
  initialSeats: Seat[];
  onChange: (layout: {
    seats: Seat[];
    sections: EditorSection[];
    rows: number;
    columns: number;
  }) => void;
  onSave?: () => Promise<void>;
}

// Interfaces para selección
export interface SelectionBox {
  start: Point;
  end: Point;
}

export interface GridConfig {
  size: number;
  color: string;
  opacity: number;
}