  // types/editor.ts
  import { Point, SeatStatus, SectionType } from './common';
  
  export interface EditorSeat {
    id: string;
    row: number;
    column: number;
    sectionId: string;
    status: 'ACTIVE' | 'DISABLED';
    position: Point;
    label: string;
    screenPosition: Point;
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
  
  export interface EditorState {
    seats: EditorSeat[];
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
  
  export interface SeatingMapEditorProps {
    initialSections: EditorSection[];
    initialSeats: EditorSeat[];
    onSave?: () => Promise<void>;
    onChange: (layout: {
      seats: EditorSeat[];
      sections: EditorSection[];
      rows: number;
      columns: number;
    }) => void;
  }
  
