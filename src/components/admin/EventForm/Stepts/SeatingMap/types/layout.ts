// components/admin/EventForm/steps/SeatingMap/types/layout.ts
import { Seat } from '../types';
import { Section } from "@/components/admin/EventForm/Stepts/SeatedTickets/types";

export interface TemplateParams {
  totalRows: number;
  seatsPerRow: number;
  aislePositions?: number[];
  sectionConfigs: {
    id: string;
    name: string;
    type: 'REGULAR' | 'VIP' | 'DISABLED';
    color: string;
    price: number;
    rowRange: [number, number];
  }[];
}

export interface LayoutConfig {
  seats: Seat[];
  sections: Section[];
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  generateLayout: (params: TemplateParams) => LayoutConfig;
}

export interface SeatingStepData extends LayoutConfig {
  seats: Seat[];
  sections: Section[];
}