  // types/form.ts
  import { EventType, StepKey } from './common';
  import { EditorSection, EditorSeat } from './editor';
  
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
    eventType: EventType;
    seatingChart?: {
      rows: number;
      columns: number;
      sections: EditorSection[];
      seats: EditorSeat[];
      customLayout?: boolean;
    };
    generalTickets?: GeneralTicket[];
    seating?: {
      sections: EditorSection[];
    } | null;
  }
  
  export interface StepProps {
    data: EventFormData;
    onEdit: (step: StepKey) => void;
  }