import { Point, Seat } from "../types";

// components/admin/EventForm/steps/SeatingMap/utils/selection.ts
export const selectionUtils = {
    isPointInRect: (point: Point, rect: { start: Point; end: Point }): boolean => {
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
  
    getSeatsInSelection: (seats: Seat[], selectionRect: { start: Point; end: Point }): string[] => {
      return seats
        .filter(seat => selectionUtils.isPointInRect(seat.position, selectionRect))
        .map(seat => seat.id);
    }
  };
  
  