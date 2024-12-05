// components/admin/EventForm/steps/SeatingMap/utils/index.ts
import { Point, Seat, SelectionBox } from '../types';

export const transformUtils = {
  screenToWorld: (point: Point, pan: Point, zoom: number): Point => ({
    x: (point.x - pan.x) / zoom,
    y: (point.y - pan.y) / zoom
  }),

  worldToScreen: (point: Point, pan: Point, zoom: number): Point => ({
    x: point.x * zoom + pan.x,
    y: point.y * zoom + pan.y
  }),

  snapToGrid: (point: Point, gridSize: number): Point => ({
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  })
};

export const selectionUtils = {
  isPointInRect: (point: Point, rect: SelectionBox): boolean => {
    const minX = Math.min(rect.start.x, rect.end.x);
    const maxX = Math.max(rect.start.x, rect.end.x);
    const minY = Math.min(rect.start.y, rect.end.y);
    const maxY = Math.max(rect.start.y, rect.end.y);

    return (
      point.x >= minX &&
      point.x <= maxX &&
      point.y >= minY &&
      point.y <= maxY
    );
  },

  getSeatsInSelection: (
    seats: (Seat & { screenPosition: Point })[],
    selectionRect: SelectionBox
  ): Seat[] => {
    return seats.filter(seat => 
      selectionUtils.isPointInRect(
        seat.screenPosition, 
        selectionRect
      )
    );
  }
};

// Utilidades adicionales para el manejo del grid
export const gridUtils = {
  calculateGridSize: (zoom: number, baseSize: number = 30): number => {
    return baseSize * zoom;
  },

  getGridPosition: (point: Point, gridSize: number): { row: number; column: number } => {
    return {
      row: Math.floor(point.y / gridSize),
      column: Math.floor(point.x / gridSize)
    };
  },

  createSeatLabel: (row: number, column: number): string => {
    return `${String.fromCharCode(65 + row)}${column + 1}`;
  }
};

// Utilidades para validación
export const validationUtils = {
  isSeatInSection: (
    seat: Partial<Seat>,
    section: { rowStart: number; rowEnd: number; columnStart: number; columnEnd: number }
  ): boolean => {
    if (typeof seat.row !== 'number' || typeof seat.column !== 'number') return false;
    
    return (
      seat.row >= section.rowStart - 1 &&
      seat.row <= section.rowEnd - 1 &&
      seat.column >= section.columnStart - 1 &&
      seat.column <= section.columnEnd - 1
    );
  },

  isValidSeatPosition: (
    position: Point,
    seats: Seat[],
    gridSize: number
  ): boolean => {
    const row = Math.floor(position.y / gridSize);
    const column = Math.floor(position.x / gridSize);
    
    return !seats.some(seat => 
      seat.row === row && seat.column === column
    );
  }
};

// Utilidades para transformaciones de coordenadas
export const coordinateUtils = {
  screenToGrid: (
    screenPoint: Point,
    pan: Point,
    zoom: number,
    gridSize: number
  ): Point => {
    const worldPoint = transformUtils.screenToWorld(screenPoint, pan, zoom);
    return transformUtils.snapToGrid(worldPoint, gridSize);
  },

  worldToGrid: (
    worldPoint: Point,
    gridSize: number
  ): Point => {
    return transformUtils.snapToGrid(worldPoint, gridSize);
  }
};