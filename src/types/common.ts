// types/common.ts
export interface Point {
    x: number;
    y: number;
  }
  
  export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'ACTIVE' | 'DISABLED';
  export type SectionType = 'REGULAR' | 'VIP' | 'DISABLED';
  export type EventType = 'SEATED' | 'GENERAL';
  export type StepKey = 'info' | 'type' | 'tickets' | 'review';