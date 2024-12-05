import React, { useRef, useCallback, useState, useMemo } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { 
  EditorCanvasProps, 
  Point, 
  DragState, 
  EditorSection, 
} from '../types';
import { transformUtils, selectionUtils } from '../utils/transform';
import { SeatComponent } from './SeatComponent';
import { GRID_SIZE } from '../constants';

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  state,
  bounds,
  onSeatAdd,
  onSeatSelect,
  onSeatsUpdate,
  onSectionSelect
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    start: null,
    current: null,
    mode: null
  });

  // Grid settings
  const gridSize = GRID_SIZE * state.zoom;
  const gridOffset = {
    x: state.pan.x % gridSize,
    y: state.pan.y % gridSize
  };

  // Transform seats for rendering
  const transformedSeats = useMemo(() => 
    state.seats.map(seat => ({
      ...seat,
      screenPosition: transformUtils.worldToScreen(seat.position, state.pan, state.zoom)
    })),
    [state.seats, state.pan, state.zoom]
  );

  // Create new seat with validation
  const createNewSeat = useCallback((point: Point) => {
    if (!state.activeSectionId) return;

    const worldPoint = transformUtils.screenToWorld(point, state.pan, state.zoom);
    const snappedPoint = transformUtils.snapToGrid(worldPoint, GRID_SIZE);
    
    const row = Math.floor(snappedPoint.y / GRID_SIZE);
    const column = Math.floor(snappedPoint.x / GRID_SIZE);
    
    const existingSeat = state.seats.find(
      s => s.row === row && s.column === column
    );

    if (!existingSeat) {
      const activeSection = state.sections.find(s => s.id === state.activeSectionId);
      if (!activeSection) return;

      if (
        row >= activeSection.rowStart - 1 &&
        row <= activeSection.rowEnd - 1 &&
        column >= activeSection.columnStart - 1 &&
        column <= activeSection.columnEnd - 1
      ) {
        onSeatAdd({
          position: snappedPoint,
          sectionId: state.activeSectionId,
          row,
          column,
          label: `${String.fromCharCode(65 + row)}${column + 1}`,
          status: 'ACTIVE',
          screenPosition: point
        });
      }
    }
  }, [state.activeSectionId, state.pan, state.zoom, state.seats, state.sections, onSeatAdd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (state.tool === 'DRAW') {
      createNewSeat(point);
      setIsDrawing(true);
      setDragState({
        start: point,
        current: point,
        mode: 'DRAW'
      });
    } else {
      setDragState({
        start: point,
        current: point,
        mode: state.tool === 'SELECT' ? 'SELECT' : 'PAN'
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || !dragState.start) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setDragState(prev => ({
      ...prev,
      current: point
    }));

    if (isDrawing && state.tool === 'DRAW') {
      createNewSeat(point);
    }
  };

  const handleMouseUp = () => {
    if (dragState.mode === 'SELECT' && dragState.start && dragState.current) {
      const selectedSeats = selectionUtils.getSeatsInSelection(
        transformedSeats,
        { start: dragState.start, end: dragState.current }
      );
      onSeatSelect(selectedSeats.map(seat => seat.id));
    }

    setIsDrawing(false);
    setDragState({
      start: null,
      current: null,
      mode: null
    });
  };

  const renderSections = () => {
    return state.sections.map((section: EditorSection) => (
      <div
        key={section.id}
        className={`absolute border-2 ${
          section.id === state.activeSectionId
            ? 'border-blue-500'
            : 'border-gray-300'
        } rounded-md bg-opacity-20`}
        style={{
          left: section.columnStart * gridSize + state.pan.x,
          top: section.rowStart * gridSize + state.pan.y,
          width: (section.columnEnd - section.columnStart + 1) * gridSize,
          height: (section.rowEnd - section.rowStart + 1) * gridSize,
          backgroundColor: section.color,
          opacity: 0.2
        }}
        onClick={() => onSectionSelect?.(section.id)}
      />
    ));
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
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`
        }}
      />

      {/* Main container */}
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
        {renderSections()}
        {transformedSeats.map(seat => (
          <SeatComponent
            key={seat.id}
            seat={seat}
            selected={state.selectedSeats.includes(seat.id)}
            tool={state.tool}
            sectionColor={
              state.sections?.find(s => s.id === seat.sectionId)?.color
            }
          />
        ))}
      </motion.div>

      {/* Selection box */}
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