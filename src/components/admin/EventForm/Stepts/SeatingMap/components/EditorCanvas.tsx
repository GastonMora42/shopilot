//src/components/admin/EventForm/Steps/SeatingMap/components/EditorCanvas.tsx
import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorCanvasProps, Point, DragState, EditorSeat } from '@/types/editor';
import { Card } from '@/components/ui/Card';
import { AlertCircle, Move, ChevronLeft, ChevronRight, Maximize2, Grid } from 'lucide-react';

const GRID_SIZE = 30;
// Definimos límites para el grid en móvil
const MOBILE_GRID_LIMITS = {
  maxRows: 20,
  maxColumns: 15
};

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  state,
  bounds,
  showGrid = true,
  onSeatAdd,
  onSeatSelect,
  onSeatsUpdate,
  onSectionSelect,
  onDeleteSeat
}) => {
  // Previous state definitions remain the same
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    start: null,
    current: null,
    mode: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverSeat, setHoverSeat] = useState<string | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [isSectionsPanelOpen, setIsSectionsPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    <Card className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 text-xs bg-white/95 backdrop-blur shadow-lg z-50 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-3 w-3 text-[#0087ca]" />
        {children}
      </div>
    </Card>
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

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

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

  // New function for mobile touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    // Similar logic to handleMouseDown but optimized for touch
    switch (state.tool) {
      case 'DRAW':
        createNewSeat(point);
        break;
      case 'ERASE':
        eraseSeat(point);
        break;
      case 'SELECT':
        setDragState({ start: point, current: point, mode: 'SELECT' });
        break;
    }
  }, [state.tool, createNewSeat, eraseSeat]);

  // Add touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canvasRef.current || !dragState.start) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    setDragState(prev => ({
      ...prev,
      current: point
    }));

    if (state.tool === 'DRAW') {
      createNewSeat(point);
    } else if (state.tool === 'ERASE') {
      eraseSeat(point);
    }
  }, [dragState.start, state.tool, createNewSeat, eraseSeat]);

    // Añadir manejo de gestos para móvil
useEffect(() => {
  let touchStart: number;
  
  const handleTouchStart = (e: TouchEvent) => {
    touchStart = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    // Si el deslizamiento es suficiente, mostrar/ocultar el panel
    if (Math.abs(diff) > 50) {
      if (diff > 0 && isSectionsPanelOpen) {
        setIsSectionsPanelOpen(false);
      } else if (diff < 0 && !isSectionsPanelOpen) {
        setIsSectionsPanelOpen(true);
      }
    }
  };

  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchmove', handleTouchMove);

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
}, [isSectionsPanelOpen]);

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
      <div className="relative flex flex-col h-full bg-gray-50">
        {/* Canvas controls header */}
        <div className="sticky top-0 z-20 px-4 py-3 bg-white/95 backdrop-blur border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Zoom: {Math.round(state.zoom * 100)}%
              </span>
              <span className="text-sm font-medium">
                {state.seats.length} asientos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => showGrid}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
  
        {/* Main canvas area */}
        <div className={`relative flex-1 overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50 bg-gray-50' : ''
        }`}>
          {/* Mobile instruction overlay */}
          <AnimatePresence>
            {showMobileHint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4 right-4 z-30 lg:hidden"
              >
                <Card className="bg-white/95 backdrop-blur p-4">
                  <div className="flex items-start gap-3">
                    <Move className="h-5 w-5 text-[#0087ca] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        {state.tool === 'DRAW' ? 'Toca para añadir asientos' : 
                         state.tool === 'ERASE' ? 'Toca para eliminar asientos' :
                         'Toca para seleccionar asientos'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMobileHint(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Canvas with improved touch handling */}
          <div
            ref={canvasRef}
            className="relative w-full h-full touch-pan-y"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Grid with better visibility */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(229,231,235,0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(229,231,235,0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE * state.zoom}px ${GRID_SIZE * state.zoom}px`,
                  backgroundPosition: `${state.pan.x}px ${state.pan.y}px`
                }}
              />
            )}
  
            {/* Sections and seats container */}
            <motion.div
              className="absolute inset-0"
              style={{
                transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`
              }}
            >
              {/* Sections with improved visual hierarchy */}
              {state.sections.map(section => (
                <motion.div
                  key={section.id}
                  className={`absolute transition-all duration-200 ${
                    section.id === state.activeSectionId 
                      ? 'ring-4 ring-[#0087ca]/20' 
                      : 'ring-1 ring-gray-200'
                  }`}
                  style={{
                    left: section.columnStart * GRID_SIZE,
                    top: section.rowStart * GRID_SIZE,
                    width: (section.columnEnd - section.columnStart + 1) * GRID_SIZE,
                    height: (section.rowEnd - section.rowStart + 1) * GRID_SIZE,
                    backgroundColor: `${section.color}${
                      section.id === state.activeSectionId ? '20' : '10'
                    }`,
                    borderRadius: '0.5rem'
                  }}
                  onClick={() => onSectionSelect(section.id)}
                  whileHover={{ scale: 1.01 }}
                />
              ))}
  
              {/* Seats with improved interaction feedback */}
              {transformedSeats.map(seat => (
                <motion.div
                  key={seat.id}
                  className={`
                    absolute flex items-center justify-center 
                    w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-lg
                    transition-all duration-150
                    ${state.selectedSeats.includes(seat.id) ? 'ring-2 ring-[#0087ca]' : ''}
                    ${seat.status === 'DISABLED' ? 'opacity-50' : ''}
                    ${state.tool === 'ERASE' ? 'hover:bg-red-200' : ''}
                    ${hoverSeat === seat.id ? 'shadow-lg scale-110' : 'shadow-md'}
                  `}
                  style={{
                    left: seat.screenPosition.x,
                    top: seat.screenPosition.y,
                    backgroundColor: state.sections.find(s => s.id === seat.sectionId)?.color || '#E5E7EB',
                    cursor: state.tool === 'SELECT' ? 'move' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: 'white'
                  }}
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    scale: state.selectedSeats.includes(seat.id) ? 1.1 : 1
                  }}
                  onMouseEnter={() => setHoverSeat(seat.id)}
                  onMouseLeave={() => setHoverSeat(null)}
                >
                  {seat.label}
                  {state.selectedSeats.includes(seat.id) && (
                    <Tooltip>
                      {state.sections.find(s => s.id === seat.sectionId)?.name} - 
                      {seat.status === 'AVAILABLE' ? 'Disponible' : 'Deshabilitado'}
                    </Tooltip>
                  )}
                </motion.div>
              ))}
            </motion.div>
  
            {/* Selection box with improved visibility */}
            {dragState.mode === 'SELECT' && dragState.start && dragState.current && (
              <div
                className="absolute border-2 border-[#0087ca] bg-[#0087ca]/10 rounded-lg"
                style={{
                  left: Math.min(dragState.start.x, dragState.current.x),
                  top: Math.min(dragState.start.y, dragState.current.y),
                  width: Math.abs(dragState.current.x - dragState.start.x),
                  height: Math.abs(dragState.current.y - dragState.start.y)
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };