import { LayoutConfig } from "./types/layout";

// components/admin/EventForm/steps/SeatingMap/types.ts
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