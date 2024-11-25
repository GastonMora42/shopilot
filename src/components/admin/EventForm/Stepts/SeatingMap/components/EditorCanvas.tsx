// components/admin/EventForm/steps/SeatingMap/components/EditorCanvas.tsx
import React, { useRef, useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Seat, Point, EditorState } from '../types';
import { transformUtils, selectionUtils } from '@/components/admin/EventForm/Stepts/SeatingMap/utils/transform';
import {SeatComponent} from '@/components/admin/EventForm/Stepts/SeatingMap/components/SeatComponent'

interface EditorCanvasProps {
  state: EditorState;
  bounds: { width: number; height: number };
  onSeatAdd: (seat: Omit<Seat, 'id'>) => void;
  onSeatSelect: (seatIds: string[]) => void;
  onSeatsUpdate: (updates: Partial<Seat>, seatIds?: string[]) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  state,
  bounds,
  onSeatAdd,
  onSeatSelect,
  onSeatsUpdate
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragState, setDragState] = useState<{
    start: Point | null;
    current: Point | null;
    mode: 'SELECT' | 'PAN' | null;
  }>({
    start: null,
    current: null,
    mode: null
  });

  // Memoize transformed seats for better performance
  const transformedSeats = React.useMemo(() => 
    state.seats.map(seat => ({
      ...seat,
      screenPosition: transformUtils.worldToScreen(seat.position, state.pan, state.zoom)
    })),
    [state.seats, state.pan, state.zoom]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setDragState({
      start: point,
      current: point,
      mode: state.tool === 'SELECT' ? 'SELECT' : 'PAN'
    });

    if (state.tool === 'DRAW' && state.activeSectionId) {
      const worldPoint = transformUtils.screenToWorld(point, state.pan, state.zoom);
      const snappedPoint = transformUtils.snapToGrid(worldPoint, 20);

      onSeatAdd({
        position: snappedPoint,
        sectionId: state.activeSectionId,
        row: Math.floor(snappedPoint.y / 20),
        column: Math.floor(snappedPoint.x / 20),
        label: `${String.fromCharCode(65 + Math.floor(snappedPoint.y / 20))}${Math.floor(snappedPoint.x / 20) + 1}`,
        status: 'ACTIVE',
        screenPosition: undefined
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.start || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setDragState(prev => ({
      ...prev,
      current: currentPoint
    }));
  };

  const handleMouseUp = () => {
    if (dragState.mode === 'SELECT' && dragState.start && dragState.current) {
      const selectedSeats = selectionUtils.getSeatsInSelection(
        state.seats,
        { start: dragState.start, end: dragState.current }
      );
      onSeatSelect(selectedSeats.map(seat => seat));
    }

    setDragState({
      start: null,
      current: null,
      mode: null
    });
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          scale: state.zoom,
          x: state.pan.x,
          y: state.pan.y
        }}
        drag={state.tool === 'SELECT' && !dragState.start}
        dragControls={dragControls}
        dragMomentum={false}
      >
        {transformedSeats.map(seat => (
          <SeatComponent
            key={seat.id}
            seat={seat}
            selected={state.selectedSeats.includes(seat.id)}
            tool={state.tool}
          />
        ))}
      </motion.div>

      {dragState.mode === 'SELECT' && dragState.start && dragState.current && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20"
          style={{
            left: Math.min(dragState.start.x, dragState.current.x),
            top: Math.min(dragState.start.y, dragState.current.y),
            width: Math.abs(dragState.current.x - dragState.start.x),
            height: Math.abs(dragState.current.y - dragState.start.y)
          }}
        />
      )}
    </div>
  );
};