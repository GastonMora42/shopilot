import { Section } from "../../SeatedTickets/types";
import { Seat } from "../types";

// components/admin/EventForm/steps/SeatingMap/utils/export.ts
interface ExportedLayout {
    version: string;
    seats: Seat[];
    sections: Section[];
    metadata: {
      createdAt: string;
      updatedAt: string;
      name?: string;
    };
  }
  
  export const exportLayout = (seats: Seat[], sections: Section[], name?: string): ExportedLayout => {
    return {
      version: '1.0',
      seats,
      sections,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name
      }
    };
  };
  
  export const importLayout = (data: ExportedLayout): { seats: Seat[]; sections: Section[] } => {
    // Validate version compatibility
    if (data.version !== '1.0') {
      throw new Error('Versión de layout incompatible');
    }
  
    return {
      seats: data.seats,
      sections: data.sections
    };
  };