// types/index.ts
import { ObjectId, Document } from 'mongoose';

// Types básicos
export type TicketStatus = 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'ACTIVE' | 'DISABLED';
export type SeatType = 'REGULAR' | 'VIP' | 'DISABLED';
export type EventType = 'SEATED' | 'GENERAL';

// Interfaces base
export interface Point {
 x: number;
 y: number;
}

// Interfaces de Modelos
export interface ISeat extends Document {
 _id: ObjectId;
 eventId: ObjectId;
 seatId: string;
 row: number;
 column: number;
 status: SeatStatus;
 type: SeatType;
 price: number;
 section: string;
 sectionId: string;
 label: string;
 position?: Point;
 temporaryReservation?: {
   sessionId: string;
   expiresAt: Date;
 };
 ticketId?: ObjectId;
 createdAt: Date;
 updatedAt: Date;
}

export interface ISection extends Document {
 id: string;
 name: string;
 type: SeatType;
 price: number;
 rowStart: number;
 rowEnd: number;
 columnStart: number;
 columnEnd: number;
 color: string;
 capacity: number;
 availableSeats?: number;
 published: boolean;
}

export interface ITicket extends Document {
 qrTickets: any;
 qrValidation: any;
 qrMetadata: any;
 _id: string;
 eventId: ObjectId;
 eventType: EventType;
 seats?: string[];
 ticketType?: {
   name: string;
   price: number;
 };
 quantity?: number;
 buyerInfo: {
   name: string;
   email: string;
   dni: string;
   phone?: string;
 };
 qrCode: string;
 status: TicketStatus;
 paymentId?: string;
 price: number;
 createdAt: Date;
 updatedAt: Date;
}

// Interfaces para el mapa de asientos
export interface Section {
 id: string;
 name: string;
 type: SeatType;
 price: number;
 rowStart: number;
 rowEnd: number;
 columnStart: number;
 columnEnd: number;
 color: string;
 published: boolean;
}

export interface Seat {
 _id: string;
 id: string;
 eventId: string;
 seatId: string;
 row: number;
 column: number;
 status: SeatStatus;
 type: SeatType;
 price: number;
 section: string;
 sectionId: string;
 label: string;
 position: Point;
 temporaryReservation?: {
   sessionId: string;
   expiresAt: Date;
 };
 lastReservationAttempt?: Date;
}

export interface SeatingChart {
 rows: number;
 columns: number;
 seats: Seat[];
 sections: Section[];
 customLayout?: boolean;
}

// Interfaces para requests/responses
export interface CreateTicketRequest {
 eventId: string;
 eventType: EventType;
 seats?: string[];
 ticketType?: {
   name: string;
   price: number;
 };
 quantity?: number;
 buyerInfo: {
   name: string;
   email: string;
   dni: string;
   phone?: string;
 };
 sessionId?: string;
}

export interface PreferenceData {
 _id: string;
 eventName: string;
 price: number;
 description: string;
 seats?: string;
}

export interface TicketResponse {
 success: boolean;
 ticket?: {
   id: string;
   status: TicketStatus;
   eventName: string;
   date: string;
   location: string;
   seats?: string[];
   ticketType?: {
     name: string;
     quantity: number;
   };
   qrCode: string;
   buyerInfo: {
     name: string;
     email: string;
   };
   price: number;
 };
 error?: string;
}

export interface TicketValidation {
 success: boolean;
 ticket?: {
   eventName: string;
   buyerName: string;
   seatNumber?: string;
   ticketType?: string;
   quantity?: number;
   status: TicketStatus;
 };
 error?: string;
}

export interface PaymentVerificationResponse {
 success: boolean;
 status?: TicketStatus;
 paymentId?: string;
 error?: string;
}

export interface MercadoPagoWebhookData {
 type: string;
 data: {
   id: string;
   status: string;
   external_reference: string;
 };
}

export interface SeatReservation {
 sessionId: string;
 expiresAt: Date;
}

export interface ReservationResponse {
 success: boolean;
 expiresAt: string;
 error?: string;
 unavailableSeats?: string[];
}
