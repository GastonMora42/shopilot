import { Section } from '.';
import { EventType, StepKey } from './common';
import { GeneralTicket } from './event';
import { SeatingChart } from './seating';

export interface EventFormData {
  name: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  eventType: EventType;
  published?: boolean;
  seatingChart?: SeatingChart;
  generalTickets?: GeneralTicket[];
  seating?: {
    sections: Section[];
  } | null;
}

export interface StepProps {
  data: EventFormData;
  onEdit: (step: StepKey) => void;
}
  
  export interface StepProps {
    data: EventFormData;
    onEdit: (step: StepKey) => void;
  }