// components/admin/EventForm/steps/SeatedTickets/types.ts
export interface Section {
    rowStart: number;
    id: string;
    name: string;
    type: 'REGULAR' | 'VIP' | 'DISABLED';
    price: number;
    capacity?: number;
    color?: string;
  }
  
  export interface SeatLayout {
    sections: Section[];
    rows: number;
    columns: number;
    customLayout: boolean;
  }
  
