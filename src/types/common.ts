// types/common.ts
export interface Point {
    x: number;
    y: number;
  }
  
  export type EventType = 'SEATED' | 'GENERAL';
  export type StepKey = 'info' | 'type' | 'tickets' | 'review' | 'BASIC_INFO' | 'EVENT_TYPE' | 'TICKETS' | 'REVIEW';
  export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';
  export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  