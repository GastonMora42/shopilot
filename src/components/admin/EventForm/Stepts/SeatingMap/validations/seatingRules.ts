// validation/seatingRules.ts
import { 
    LayoutConfig, 
    EditorSeat, 
    EditorSection,
  } from '@/types/editor';
  
  export interface ValidationError {
    type: ValidationErrorType;
    message: string;
    sectionId?: string;
    seatId?: string;
    row?: number;
    seats?: string[];
    affectedSeats?: string[];
    nearbySeats?: string[];
  }
  
  export type ValidationErrorType = 
    | 'SECTION_EMPTY'
    | 'INVALID_AISLE_WIDTH'
    | 'SEATS_TOO_CLOSE'
    | 'BLOCKED_EMERGENCY_EXIT'
    | 'INVALID_SECTION_CONFIG'
    | 'INVALID_SEAT_POSITION';
  
  export const validateSectionConnectivity = (layout: LayoutConfig): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    layout.sections.forEach((section: EditorSection) => {
      const sectionSeats = layout.seats.filter((seat: EditorSeat) => 
        seat.sectionId === section.id
      );
      
      if (sectionSeats.length === 0) {
        errors.push({
          type: 'SECTION_EMPTY',
          message: `La sección "${section.name}" no tiene asientos asignados`,
          sectionId: section.id
        });
      }
  
      // Validar configuración de sección
      if (section.rowEnd < section.rowStart || section.columnEnd < section.columnStart) {
        errors.push({
          type: 'INVALID_SECTION_CONFIG',
          message: `Configuración inválida para la sección "${section.name}"`,
          sectionId: section.id
        });
      }
    });
  
    return errors;
  };
  
  export const validateAisleSpacing = (layout: LayoutConfig): ValidationError[] => {
    const errors: ValidationError[] = [];
    const MIN_AISLE_WIDTH = 2;
  
    const seatsByRow = layout.seats.reduce((acc: Record<number, EditorSeat[]>, seat) => {
      if (!acc[seat.row]) {
        acc[seat.row] = [];
      }
      acc[seat.row].push(seat);
      return acc;
    }, {});
  
    Object.entries(seatsByRow).forEach(([row, rowSeats]) => {
      const sortedSeats = [...rowSeats].sort((a, b) => a.column - b.column);
      
      for (let i = 0; i < sortedSeats.length - 1; i++) {
        const currentSeat = sortedSeats[i];
        const nextSeat = sortedSeats[i + 1];
        const gap = nextSeat.column - currentSeat.column;
  
        if (gap > 1 && gap < MIN_AISLE_WIDTH) {
          errors.push({
            type: 'INVALID_AISLE_WIDTH',
            message: `El pasillo entre las columnas ${currentSeat.column} y ${nextSeat.column} en la fila ${currentSeat.row} es muy estrecho`,
            row: Number(row),
            seats: [currentSeat.id, nextSeat.id]
          });
        }
      }
    });
  
    return errors;
  };
  
  export const validateSeatSpacing = (layout: LayoutConfig): ValidationError[] => {
    const errors: ValidationError[] = [];
    const MIN_SEAT_SPACING = 1;
  
    layout.seats.forEach((seat: EditorSeat) => {
      // Validar posición del asiento dentro de su sección
      const section = layout.sections.find(s => s.id === seat.sectionId);
      if (section) {
        if (seat.row < section.rowStart || 
            seat.row > section.rowEnd || 
            seat.column < section.columnStart || 
            seat.column > section.columnEnd) {
          errors.push({
            type: 'INVALID_SEAT_POSITION',
            message: `El asiento ${seat.label} está fuera de los límites de su sección`,
            seatId: seat.id,
            sectionId: section.id
          });
        }
      }
  
      // Validar espaciado entre asientos
      const nearbySeats = layout.seats.filter(s => 
        s.id !== seat.id &&
        Math.abs(s.position.x - seat.position.x) < MIN_SEAT_SPACING &&
        Math.abs(s.position.y - seat.position.y) < MIN_SEAT_SPACING
      );
  
      if (nearbySeats.length > 0) {
        errors.push({
          type: 'SEATS_TOO_CLOSE',
          message: `El asiento ${seat.label} está muy cerca de otros asientos`,
          seatId: seat.id,
          nearbySeats: nearbySeats.map(s => s.id)
        });
      }
    });
  
    return errors;
  };
  
  export const validateEmergencyExits = (layout: LayoutConfig): ValidationError[] => {
    const errors: ValidationError[] = [];
    const MIN_EXIT_WIDTH = 3;
    
    const maxRow = Math.max(...layout.seats.map(s => s.row));
    const maxCol = Math.max(...layout.seats.map(s => s.column));
  
    // Validar espacios en los bordes laterales
    [0, maxCol].forEach(column => {
      const nearExitSeats = layout.seats.filter(seat => 
        Math.abs(seat.column - column) < MIN_EXIT_WIDTH
      );
      
      if (nearExitSeats.length > 0) {
        errors.push({
          type: 'BLOCKED_EMERGENCY_EXIT',
          message: `No hay suficiente espacio para salidas de emergencia en la columna ${column}`,
          affectedSeats: nearExitSeats.map(s => s.id)
        });
      }
    });
  
    // Validar espacio en la parte trasera
    const backRowSeats = layout.seats.filter(seat => 
      seat.row === maxRow && 
      seat.status !== 'DISABLED'
    );
  
    if (backRowSeats.length > 0) {
      errors.push({
        type: 'BLOCKED_EMERGENCY_EXIT',
        message: 'Se requiere espacio libre en la última fila para salidas de emergencia',
        affectedSeats: backRowSeats.map(s => s.id)
      });
    }
  
    return errors;
  };
  
  export const validateSeatingLayout = (layout: LayoutConfig): ValidationError[] => {
    const validators = [
      validateSectionConnectivity,
      validateAisleSpacing,
      validateSeatSpacing,
      validateEmergencyExits
    ];
  
    return validators.reduce((allErrors: ValidationError[], validator) => {
      const validatorErrors = validator(layout);
      return [...allErrors, ...validatorErrors];
    }, []);
  };