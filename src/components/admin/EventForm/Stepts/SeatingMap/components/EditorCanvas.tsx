import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  EditorCanvasProps, 
  Point, 
  DragState, 
  EditorSeat} from '@/types/editor';

const GRID_SIZE = 30;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  state,
  bounds,
  showGrid = true,
  onSeatAdd,
  onSeatSelect,
  onSeatsUpdate,
  onSectionSelect,
  
  onDeleteSeat // Nueva prop para borrar asientos
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


  // Primero, define getGridPosition fuera de moveSeat
const getGridPosition = useCallback((point: Point) => {
  const offsetX = state.pan.x;
  const offsetY = state.pan.y;
  const scaledGridSize = GRID_SIZE * state.zoom;
  
  return {
    x: Math.floor((point.x - offsetX) / scaledGridSize),
    y: Math.floor((point.y - offsetY) / scaledGridSize)
  };
}, [state.pan, state.zoom]);

// Luego, usa getGridPosition dentro de moveSeat
const moveSeat = useCallback((seat: EditorSeat, delta: Point) => {
  const newPosition = {
    x: seat.position.x + delta.x,
    y: seat.position.y + delta.y
  };

  const gridPosition = getGridPosition(newPosition);

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
}, [onSeatsUpdate, getGridPosition]);

  // Función para crear nuevo asiento
  const createNewSeat = useCallback((point: Point) => {
    if (!state.activeSectionId) return;

    const gridPoint = getGridPosition(point);
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
        label: `${String.fromCharCode(65 + gridPoint.y)}${gridPoint.x + 1}`
      });
    }
  }, [state.activeSectionId, state.sections, state.seats, getGridPosition, onSeatAdd]);

  const handleMouseUp = useCallback(() => {
    if (dragState.mode === 'SELECT' && dragState.start && dragState.current) {
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

    setDragState({ start: null, current: null, mode: null });
    setIsDragging(false);
  }, [dragState.mode, dragState.start, dragState.current, transformedSeats, onSeatSelect]);

  // Cleanup effect
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragState({ start: null, current: null, mode: null });
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Añade un estado para hover en asientos
const [hoverSeat, setHoverSeat] = useState<string | null>(null);

// Función mejorada de borrado
const eraseSeat = useCallback((point: Point) => {
  const gridPoint = getGridPosition(point);
  
  // Encontrar asiento en la posición exacta
  const seatToDelete = state.seats.find(
    s => s.row === gridPoint.y && s.column === gridPoint.x
  );
  
  if (seatToDelete) {
    onDeleteSeat(seatToDelete.id);
  }
}, [state.seats, getGridPosition, onDeleteSeat]);

// Actualiza los manejadores de eventos
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  if (!canvasRef.current) return;
  
  const rect = canvasRef.current.getBoundingClientRect();
  const point = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };

  if (state.tool === 'ERASE') {
    const gridPoint = getGridPosition(point);
    const seatToDelete = state.seats.find(
      s => s.row === gridPoint.y && s.column === gridPoint.x
    );
    if (seatToDelete) {
      onDeleteSeat(seatToDelete.id);
    }
  }

  switch (state.tool) {
    case 'DRAW':
      createNewSeat(point);
      setDragState({ start: point, current: point, mode: 'DRAW' });
      break;
    case 'ERASE':
      eraseSeat(point);
      setDragState({ start: point, current: point, mode: 'ERASE' });
      break;
    case 'SELECT':
      setDragState({ start: point, current: point, mode: 'SELECT' });
      break;
  }
}, [state.tool, createNewSeat, eraseSeat]);

const handleMouseMove = useCallback((e: React.MouseEvent) => {
  if (!canvasRef.current) return;

  const rect = canvasRef.current.getBoundingClientRect();
  const point = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };

  // Actualizar hover para feedback visual
  if (state.tool === 'ERASE') {
    const gridPoint = getGridPosition(point);
    const hoveredSeat = state.seats.find(
      s => s.row === gridPoint.y && s.column === gridPoint.x
    );
    setHoverSeat(hoveredSeat?.id || null);
  }

  if (isDragging) {
    setDragState(prev => ({
      ...prev,
      current: point
    }));

    switch (state.tool) {
      case 'DRAW':
        createNewSeat(point);
        break;
      case 'ERASE':
        eraseSeat(point);
        break;
    }
  }
}, [isDragging, state.tool, createNewSeat, eraseSeat, getGridPosition]);

// Actualiza el renderizado de los asientos
{transformedSeats.map(seat => (
  <motion.div
    key={seat.id}
    className={`
      absolute flex items-center justify-center 
      w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded 
      ${state.selectedSeats.includes(seat.id) ? 'ring-2 ring-blue-500' : ''}
      ${seat.status === 'DISABLED' ? 'opacity-50' : ''}
      ${state.tool === 'ERASE' ? 'hover:bg-red-200 hover:scale-110' : ''}
      ${hoverSeat === seat.id ? 'bg-red-300' : ''}
      transition-all duration-150
    `}
    style={{
      left: seat.screenPosition.x,
      top: seat.screenPosition.y,
      backgroundColor: hoverSeat === seat.id ? 
        'rgb(248, 113, 113)' : // Rojo cuando hover en modo borrado
        (state.sections.find(s => s.id === seat.sectionId)?.color || '#E5E7EB'),
      cursor: state.tool === 'ERASE' ? 'not-allowed' : 
              state.tool === 'SELECT' ? 'move' : 'pointer',
      fontSize: '0.75rem',
      fontWeight: 'medium',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
    whileHover={{ 
      scale: state.tool === 'ERASE' ? 1.1 : 1.05 
    }}
    animate={{
      scale: state.selectedSeats.includes(seat.id) ? 1.1 : 1
    }}
    onMouseEnter={() => setHoverSeat(seat.id)}
    onMouseLeave={() => setHoverSeat(null)}
  >
    {seat.label}
  </motion.div>
))}

  // Renderizado de la cuadrícula
  const renderGrid = useCallback(() => {
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
  }, [showGrid, state.zoom, state.pan]);

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
              ${seat.status === 'DISABLED' ? 'opacity-50' : ''}
              ${state.tool === 'ERASE' ? 'hover:bg-red-200' : ''}`}
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
          >
            {seat.label}
            {state.selectedSeats.includes(seat.id) && (
              <Tooltip>
                {seat.status === 'AVAILABLE' ? 'Disponible' : 'Deshabilitado'}
                {` - ${state.sections.find(s => s.id === seat.sectionId)?.name}`}
              </Tooltip>
            )}
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