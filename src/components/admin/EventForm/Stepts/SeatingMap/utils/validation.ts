import { Section } from "../../SeatedTickets/types";
import { Seat } from "../types";

// components/admin/EventForm/steps/SeatingMap/utils/validation.ts
export const validateLayout = (seats: Seat[], sections: Section[]): string[] => {
    const errors: string[] = [];
  
    // Check for overlapping seats
    const seatPositions = new Set();
    seats.forEach(seat => {
      const posKey = `${seat.position.x},${seat.position.y}`;
      if (seatPositions.has(posKey)) {
        errors.push(`Asientos superpuestos en la posición ${posKey}`);
      }
      seatPositions.add(posKey);
    });
  
    // Check for seats without sections
    const sectionIds = new Set(sections.map(s => s.id));
    seats.forEach(seat => {
      if (!sectionIds.has(seat.sectionId)) {
        errors.push(`Asiento ${seat.label} no tiene una sección válida`);
      }
    });
  
    // Check for valid row/column numbers
    seats.forEach(seat => {
      if (seat.row < 0 || seat.column < 0) {
        errors.push(`Asiento ${seat.label} tiene números de fila/columna inválidos`);
      }
    });
  
    return errors;
  };
  
  