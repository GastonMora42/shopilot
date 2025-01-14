import React, { useRef, useCallback, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  EditorCanvasProps, 
  Point, 
  DragState, 
  EditorSeat,
  EditorSection 
} from '@/types/editor';

const GRID_SIZE = 30;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  state,
  bounds,
  showGrid = true,
  onSeatAdd,
  onSeatSelect,
  onSeatsUpdate,
  onSectionSelect
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    start: null,
    current: null,
    mode: null
  });
  const [isDragging, setIsDragging] = useState(false);

  // Transform seats for rendering
  const transformedSeats = useMemo(() => 
    state.seats.map(seat => ({
      ...seat,
      screenPosition: {
        x: seat.position.x + state.pan.x,
        y: seat.position.y + state.pan.y
      }
    })),
    [state.seats, state.pan]
  );

  const Tooltip = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute top-full mt-1 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
      {children}
    </div>
  );
  
  // Función para crear nuevo asiento
  const createNewSeat = useCallback((point: Point) => {
    if (!state.activeSectionId) return;

    const gridPoint = {
      x: Math.floor((point.x - state.pan.x) / (GRID_SIZE * state.zoom)),
      y: Math.floor((point.y - state.pan.y) / (GRID_SIZE * state.zoom))
    };

    const activeSection = state.sections.find(s => s.id === state.activeSectionId);
    if (!activeSection) return;

    // Verificar si ya existe un asiento en esa posición
    const existingSeat = state.seats.find(
      s => s.row === gridPoint.y && s.column === gridPoint.x
    );

    if (!existingSeat) {
      onSeatAdd({
        row: gridPoint.y,
        column: gridPoint.x,
        sectionId: state.activeSectionId,
        position: {
          x: gridPoint.x * GRID_SIZE,
          y: gridPoint.y * GRID_SIZE
        },
        label: `R${gridPoint.y + 1}C${gridPoint.x + 1}`
      });
    }
  }, [state.activeSectionId, state.sections, state.seats, state.pan, state.zoom, onSeatAdd]);

  // Función para mover asientos
  const moveSeat = useCallback((seat: EditorSeat, delta: Point) => {
    const newPosition = {
      x: seat.position.x + delta.x,
      y: seat.position.y + delta.y
    };

    const gridPosition = {
      x: Math.round(newPosition.x / GRID_SIZE),
      y: Math.round(newPosition.y / GRID_SIZE)
    };

    onSeatsUpdate(
      {
        row: gridPosition.y,
        column: gridPosition.x,
        position: {
          x: gridPosition.x * GRID_SIZE,
          y: gridPosition.y * GRID_SIZE
        }
      },
      [seat.id]
    );
  }, [onSeatsUpdate]);

  // Manejadores de eventos del mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (state.tool === 'DRAW') {
      createNewSeat(point);
      setDragState({
        start: point,
        current: point,
        mode: 'DRAW'
      });
    } else if (state.tool === 'SELECT') {
      setDragState({
        start: point,
        current: point,
        mode: 'SELECT'
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

    if (dragState.mode === 'DRAW') {
      createNewSeat(point);
    }
  };

  const handleMouseUp = () => {
    if (dragState.mode === 'SELECT' && dragState.start && dragState.current) {
      // Seleccionar asientos dentro del área
      const selectedSeats = transformedSeats.filter(seat => {
        const isInSelectionBox = 
          seat.screenPosition.x >= Math.min(dragState.start!.x, dragState.current!.x) &&
          seat.screenPosition.x <= Math.max(dragState.start!.x, dragState.current!.x) &&
          seat.screenPosition.y >= Math.min(dragState.start!.y, dragState.current!.y) &&
          seat.screenPosition.y <= Math.max(dragState.start!.y, dragState.current!.y);
        return isInSelectionBox;
      });

      onSeatSelect(selectedSeats.map(seat => seat.id));
    }

    setDragState({
      start: null,
      current: null,
      mode: null
    });
    setIsDragging(false);
  };

  // Renderizado de la cuadrícula
  const renderGrid = () => {
    if (!showGrid) return null;
  
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E5E7EB 1px, transparent 1px),
            linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * state.zoom}px ${GRID_SIZE * state.zoom}px`,
          backgroundPosition: `${state.pan.x}px ${state.pan.y}px`,
          opacity: 0.5
        }}
      />
    );
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
      {renderGrid()}

      <motion.div
        className="absolute inset-0"
        style={{
          transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`
        }}
      >
        {/* Render sections */}
{state.sections.map(section => (
  <div
    key={section.id}
    className={`absolute transition-all duration-200
      ${section.id === state.activeSectionId 
        ? 'border-2 border-blue-500 ring-4 ring-blue-200 ring-opacity-50' 
        : 'border border-gray-300'}`}
    style={{
      left: section.columnStart * GRID_SIZE,
      top: section.rowStart * GRID_SIZE,
      width: (section.columnEnd - section.columnStart + 1) * GRID_SIZE,
      height: (section.rowEnd - section.rowStart + 1) * GRID_SIZE,
      backgroundColor: section.color,
      opacity: section.id === state.activeSectionId ? 0.3 : 0.1,
      borderRadius: '0.5rem'
    }}
    onClick={() => onSectionSelect(section.id)}
  />
))}

        {/* Render seats */}
{transformedSeats.map(seat => (
  <motion.div
    key={seat.id}
    className={`absolute flex items-center justify-center 
      w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded 
      ${state.selectedSeats.includes(seat.id) ? 'ring-2 ring-blue-500' : ''}
      ${seat.status === 'DISABLED' ? 'opacity-50' : ''}`}
    style={{
      left: seat.screenPosition.x,
      top: seat.screenPosition.y,
      backgroundColor: state.sections.find(s => s.id === seat.sectionId)?.color || '#E5E7EB',
      cursor: state.tool === 'SELECT' ? 'move' : 'pointer',
      fontSize: '0.75rem',
      fontWeight: 'medium',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
    whileHover={{ scale: 1.1 }}
    animate={{
      scale: state.selectedSeats.includes(seat.id) ? 1.1 : 1
    }}
    
    onMouseEnter={(e) => {
      if (state.tool === 'SELECT') {
        e.currentTarget.title = 'Arrastra para mover';
      }
    }}
  >
    {seat.label}
    {state.selectedSeats.includes(seat.id) && (
      <Tooltip>
        {seat.status === 'AVAILABLE' ? 'Disponible' : 'Deshabilitado'}
        {` - ${state.sections.find(s => s.id === seat.sectionId)?.name}`}
      </Tooltip>
    )}
    
    {seat.label}
  </motion.div>
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