import { Section } from "@/components/admin/EventForm/Stepts/SeatedTickets/types";

export interface Point {
  x: number;
  y: number;
}

// Tipos base
export type EditorTool = 
  | 'SELECT' 
  | 'DRAW' 
  | 'ERASE' 
  | 'ROW_DRAW'
  | 'SECTION'
  | 'TEXT'
  | 'SHAPE';

export type SeatStatus = 
  | 'AVAILABLE' 
  | 'OCCUPIED' 
  | 'DISABLED' 
  | 'RESERVED';

export type SectionType = 
  | 'REGULAR' 
  | 'VIP' 
  | 'DISABLED';

// Interfaces principales
export interface EditorSeat {
  id: string;
  row: number;
  column: number;
  sectionId: string;
  status: SeatStatus;
  label: string;
  position: Point;
  screenPosition: Point;
  rotation?: number;
  properties?: {
    isAisle?: boolean;
    isHandicap?: boolean;
    isReserved?: boolean;
  };
}

export interface EventSeatingChart {
  rows: number;
  columns: number;
  sections: Array<{
    name: string;
    type: SectionType;
    price: number;
    rowStart: number;
    rowEnd: number;
    columnStart: number;
    columnEnd: number;
  }>;
  seats: Array<{
    row: number;
    column: number;
    section: string;
    status: SeatStatus;
    label: string;
  }>;
}

export interface EditorSection {
  id: string;
  name: string;
  type: SectionType;
  color: string;
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  capacity?: number;
  description?: string;
  aisleAfter?: number[];
}

// Configuración y Templates
export interface TemplateConfig {
  sections: Array<{
    name: string;
    type: SectionType;
    rows: number;
    seatsPerRow: number;
    price: number;
    color: string;
    aisleAfter?: number[];
  }>;
  spacing?: {
    rowGap: number;
    seatGap: number;
    aisleWidth: number;
  };
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  sections: EditorSection[];
  defaultConfig: TemplateConfig;
  generateLayout: (params: {
    totalRows: number;
    seatsPerRow: number;
    sectionConfigs: Array<{
      id: string;
      name: string;
      type: SectionType;
      color: string;
      price: number;
      rowRange: [number, number];
    }>;
    spacing?: {
      rowGap: number;
      seatGap: number;
      aisleWidth: number;
    };
  }) => LayoutConfig;
}

export interface LayoutConfig {
  rows: number;
  columns: number;
  seats: EditorSeat[];
  sections: EditorSection[];
}

// Estados y Props
export interface EditorState {
  seats: EditorSeat[];
  sections: EditorSection[];
  selectedSeats: string[];
  activeSectionId: string | null;
  tool: 'SELECT' | 'DRAW' | 'ERASE';
  zoom: number;
  pan: Point;
}

export interface EditorActions {
  setTool: (tool: EditorTool) => void;
  setActiveSection: (sectionId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  setSections: (sections: EditorSection[]) => void;
  updateSeats: (updates: Partial<EditorSeat>, seatIds?: string[]) => void;
  addSeat: (seat: Omit<EditorSeat, 'id'>) => void;
  removeSeats: (seatIds: string[]) => void;
  undo: () => void;
  redo: () => void;
}

// Props de componentes
export interface SeatingMapEditorProps {
  initialSections: EditorSection[];
  initialSeats: EditorSeat[];
  onChange: (layout: LayoutConfig) => void;
  onSave?: () => Promise<void>;
}

export interface EditorCanvasProps {
  state: EditorState;
  bounds: ViewportBounds;
  showGrid?: boolean;
  onSeatAdd: (seatData: Partial<EditorSeat>) => void;
  onSeatSelect: (seatIds: string[]) => void;
  onSeatsUpdate: (updates: Partial<EditorSeat>, seatIds?: string[]) => void;
  onSectionSelect: (sectionId: string) => void;
}

export interface TemplateSelectorProps {
  onSelect: (template: LayoutTemplate) => void;
  onCustomLayout: () => void;
}

// Utilidades y validación
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

export interface ValidationError {
  type: string;
  message: string;
  sectionId?: string;
  seatId?: string;
  row?: number;
  seats?: string[];
  affectedSeats?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}
