import React, { FC, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EditorSeat, 
  EditorSection, 
  SeatingMapEditorProps,
  ValidationError,
  ValidationResult,
  Point, 
  SeatStatus,
  EditorTool
} from '@/types/editor';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/ToolBar';
import { Sidebar } from './components/Sidebar';
import { ZoomControls } from './components/ZoomControls';
import { AlertCircle, ChevronLeft, ChevronRight, HeadphonesIcon, HelpCircle, Minus, Plus, Save, Settings, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const GRID_SIZE = 30;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

// Definimos los límites de la cuadrícula
const GRID_LIMITS = {
  maxRows: 25,    // Aumentamos de 15 a 25
  maxColumns: 30  // Aumentamos de 20 a 30
};

const DRAWING_TOOLTIP: Record<EditorTool, string> = {
  SELECT: 'Selecciona y mueve asientos haciendo click o arrastrando',
  DRAW: 'Haz click o arrastra para dibujar múltiples asientos',
  ERASE: 'Selecciona asientos y presiona eliminar o usa esta herramienta',
  SPACE: 'Marca espacios que deben permanecer vacíos',
  ROW_DRAW: 'Dibuja una fila completa de asientos',
  SECTION: 'Dibuja una sección completa',
  TEXT: 'Añade texto al mapa',
  SHAPE: 'Dibuja formas en el mapa'
} as const;

interface SpacingConfig {
  rows: number;
  columns: number;
}

export const SeatingMapEditor: FC<SeatingMapEditorProps> = ({
  initialSections = [],
  initialSeats = [],
  onChange,
  onSave
}) => {
  // Estados básicos
  const containerRef = useRef<HTMLDivElement>(null);
  const [seats, setSeats] = useState<EditorSeat[]>(initialSeats);
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [tool, setTool] = useState<EditorTool>('SELECT');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [showDrawingHelp, setShowDrawingHelp] = useState(true);
  const [emptySpaces, setEmptySpaces] = useState<Point[]>([]);
  const [spacing, setSpacing] = useState<SpacingConfig>({ rows: 1, columns: 1 });
  const [showSpacingSettings, setShowSpacingSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showLimitsInfo, setShowLimitsInfo] = useState(true);
  const [showSupport, setShowSupport] = useState(false);

  // Funciones de validación
// También podemos agregar una validación en validateLayout
const validateLayout = useCallback((): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validación existente
  if (sections.length === 0) {
    errors.push({
      type: 'NO_SECTIONS',
      message: 'Debe crear al menos una sección'
    });
  }

  // Agregar validación de límites
  const maxRow = Math.max(...seats.map(s => s.row));
  const maxCol = Math.max(...seats.map(s => s.column));

  if (maxRow >= GRID_LIMITS.maxRows) {
    errors.push({
      type: 'GRID_LIMIT',
      message: `El número máximo de filas permitido es ${GRID_LIMITS.maxRows}`
    });
  }

  if (maxCol >= GRID_LIMITS.maxColumns) {
    errors.push({
      type: 'GRID_LIMIT',
      message: `El número máximo de columnas permitido es ${GRID_LIMITS.maxColumns}`
    });
  }

  // Resto de las validaciones existentes
  sections.forEach(section => {
    const sectionSeats = seats.filter(seat => seat.sectionId === section.id);
    
    if (!section.name.trim()) {
      errors.push({
        type: 'INVALID_SECTION',
        message: `La sección ${section.id} debe tener un nombre`,
        sectionId: section.id
      });
    }

    if (section.price <= 0) {
      errors.push({
        type: 'INVALID_PRICE',
        message: `La sección ${section.name} debe tener un precio válido`,
        sectionId: section.id
      });
    }

    if (sectionSeats.length === 0) {
      errors.push({
        type: 'EMPTY_SECTION',
        message: `La sección ${section.name} no tiene asientos asignados`,
        sectionId: section.id
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}, [sections, seats]);

  // Manejo de asientos
  const handleSeatAdd = useCallback((seatData: Partial<EditorSeat>) => {
    if (!activeSectionId) return;
  
    const row = seatData.row || 0;
    const column = seatData.column || 0;
  
    // Prevenir colocación en la primera columna
    if (column === 0) return;
  
    // Verificar límites de la cuadrícula
    if (row >= GRID_LIMITS.maxRows || column >= GRID_LIMITS.maxColumns) {
      return;
    }
  
    // Verificar si existe un asiento o espacio vacío
    const existingSeat = seats.find(seat => 
      Math.abs(seat.row - row) < spacing.rows &&
      Math.abs(seat.column - column) < spacing.columns
    );
  
    const isEmptySpace = emptySpaces.some(space => 
      space.x === row && space.y === column
    );
  
    if (existingSeat || isEmptySpace) return;
  
    const newSeat: EditorSeat = {
      id: `seat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      row,
      column,
      sectionId: activeSectionId,
      status: 'AVAILABLE',
      label: `${String.fromCharCode(65 + row)}${column + 1}`,
      position: {
        x: column * (GRID_SIZE * spacing.columns),
        y: row * (GRID_SIZE * spacing.rows)
      },
      screenPosition: {
        x: column * (GRID_SIZE * spacing.columns),
        y: row * (GRID_SIZE * spacing.rows)
      }
    };
  
    setSeats(prev => [...prev, newSeat]);
    setHasUnsavedChanges(true);
  }, [activeSectionId, spacing, seats, emptySpaces]);
  
  // Manejo de borrado y espacios vacíos
  const handleDelete = useCallback(() => {
    if (selectedSeats.length === 0) return;
    
    
    setSeats(prev => prev.filter(seat => !selectedSeats.includes(seat.id)));
    setSelectedSeats([]);
    setHasUnsavedChanges(true);
  }, [selectedSeats]);


  // Manejo de zoom y vista
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom)));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Validación y guardado
  const validateBeforeNext = useCallback((): boolean => {
    const validation = validateLayout();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    const maxRow = Math.max(...seats.map(s => s.row)) + 1;
    const maxCol = Math.max(...seats.map(s => s.column)) + 1;

    const updatedSections = sections.map(section => {
      const sectionSeats = seats.filter(seat => seat.sectionId === section.id);
      const sectionRows = sectionSeats.map(s => s.row);
      const sectionCols = sectionSeats.map(s => s.column);

      return {
        ...section,
        rowStart: Math.min(...sectionRows),
        rowEnd: Math.max(...sectionRows),
        columnStart: Math.min(...sectionCols),
        columnEnd: Math.max(...sectionCols)
      };
    });

    const layoutData = {
      seats: seats.map(seat => ({
        ...seat,
        section: sections.find(s => s.id === seat.sectionId)?.name || ''
      })),
      sections: updatedSections,
      rows: maxRow,
      columns: maxCol
    };

    onChange(layoutData);
    setSections(updatedSections);
    setHasUnsavedChanges(false);
    return true;
  }, [seats, sections, onChange, validateLayout]);

  // Manejo de guardado
  const handleSave = useCallback(async () => {
    if (!validateBeforeNext()) return;
    
    try {
      if (onSave) {
        await onSave();
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrors([{ 
        type: 'SAVE_ERROR', 
        message: 'Error al guardar el mapa de asientos' 
      }]);
    }
  }, [validateBeforeNext, onSave]);

  // Effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedSeats.length > 0) {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete, selectedSeats]);

  useEffect(() => {
    let touchStart: number;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientX;
    };
  
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;
  
      const currentTouch = e.touches[0].clientX;
      const diff = touchStart - currentTouch;
  
      if (Math.abs(diff) > 50) {
        if (diff > 0 && isSidebarOpen) {
          setIsSidebarOpen(false);
        } else if (diff < 0 && !isSidebarOpen) {
          setIsSidebarOpen(true);
        }
      }
    };
  
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
  
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isSidebarOpen]);


  return (
<div className="relative flex h-[calc(100vh-180px)]" ref={containerRef}>
  {/* Área principal del editor */}
  <div 
    className={`
      flex-1 relative overflow-hidden bg-gray-50 
      transition-all duration-300 ease-in-out
      ${isSidebarOpen ? 'lg:mr-[320px]' : 'lg:mr-0'}
    `}
  >
{/* Barra de herramientas superior */}
<div className="sticky top-0 z-20 px-4 py-3 bg-white/95 backdrop-blur border-b">
  <div className="flex items-center justify-between">
    {/* Herramientas principales */}
    <div className="flex items-center gap-4">
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        onDelete={handleDelete}
        hasSelection={selectedSeats.length > 0}
        selectedCount={selectedSeats.length}
        onSave={hasUnsavedChanges ? validateBeforeNext : undefined}
        onSpacingClick={() => setShowSpacingSettings(!showSpacingSettings)}
      />
        <button
    onClick={() => setShowSupport(true)}
    className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
    title="Necesitas ayuda?"
  >
    <HeadphonesIcon className="h-4 w-4 text-[#0087ca]" />
  </button>
    </div>

    {/* Info y controles de zoom */}
    <div className="flex items-center gap-6">
      {/* Contador de asientos */}
      <span className="text-sm text-gray-600">
        {seats.length} asientos
      </span>

      {/* Controles de zoom */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => handleZoomChange(zoom - 0.1)}
          className="p-1.5 hover:bg-white rounded-md transition-colors"
          title="Alejar"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </button>

        <button
          onClick={handleResetView}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-white rounded-md transition-colors"
          title="Restablecer zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => handleZoomChange(zoom + 0.1)}
          className="p-1.5 hover:bg-white rounded-md transition-colors"
          title="Acercar"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  </div>
</div>

{/* Contenedor de mensajes */}
<div className="absolute left-8 top-24 z-30 space-y-4 max-w-md">
  {/* Mensaje de límites */}
  <AnimatePresence>
    {showLimitsInfo && (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Card className="bg-white shadow-md border-l-4 border-[#0087ca]">
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-[#0087ca] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 mb-2">
                Límites del mapa de asientos
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 25 filas de alto</li>
                <li>• 30 columnas de ancho</li>
                <li>• Máximo 750 asientos</li>
              </ul>
            </div>
            <button
              onClick={() => setShowLimitsInfo(false)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Mensaje de consejos */}
  <AnimatePresence>
    {showDrawingHelp && (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Card className="bg-white shadow-md border-l-4 border-green-500">
          <div className="flex items-start gap-3 p-4">
            <HelpCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-800 mb-1">
                {tool === 'DRAW' ? '✨ Consejo para dibujar' : 
                 tool === 'SELECT' ? '🎯 Consejo para seleccionar' : 
                 '🗑️ Consejo para borrar'}
              </p>
              <p className="text-sm text-gray-600">
                {DRAWING_TOOLTIP[tool]}
              </p>
            </div>
            <button
              onClick={() => setShowDrawingHelp(false)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Mensaje de soporte flotante */}
<AnimatePresence>
  {showSupport && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed top-20 left-8 z-50"
    >
      <Card className="bg-white shadow-lg border-l-4 border-[#0087ca]">
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0">
            <HeadphonesIcon className="h-5 w-5 text-[#0087ca]" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 mb-1">¿Necesitas ayuda?</h4>
            <p className="text-sm text-gray-600">
              Envianos un Whatsapp al{' '}
              <a 
                href="tel:+54 9 2995 88-2072" 
                className="text-[#0087ca] hover:underline font-medium"
              >
                +54 9 2995 88-2072
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Horario de atención: Lun-Vie 9am a 6pm
            </p>
          </div>
          <button
            onClick={() => setShowSupport(false)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </Card>
    </motion.div>
  )}
</AnimatePresence>

</div>
  
{/* Editor Canvas con grid incluido */}
<div className="relative flex-1 h-[calc(100vh-120px)] bg-gray-50 overflow-hidden">
  {/* Grid y área disponible */}
  {showGrid && (
    <>
      {/* Columna inicial no utilizable */}
      <div 
        className="absolute left-0 top-0 h-full pointer-events-none"
        style={{
          transform: `translateX(${pan.x}px)`,
          width: GRID_SIZE * zoom,
          backgroundColor: 'rgba(243, 244, 246, 0.8)',
          borderRight: '2px solid rgba(75, 85, 99, 0.3)'
        }}
      />

      {/* Grid principal */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(75, 85, 99, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x + (GRID_SIZE * zoom)}px ${pan.y}px`
        }}
      />
      
      {/* Área límite disponible */}
      <div 
        className="absolute pointer-events-none"
        style={{
          left: pan.x + (GRID_SIZE * zoom), // Offset por la columna inicial
          top: pan.y,
          width: (GRID_LIMITS.maxColumns - 1) * GRID_SIZE * zoom, // Una columna menos
          height: GRID_LIMITS.maxRows * GRID_SIZE * zoom,
          border: '2px dashed rgba(0, 135, 202, 0.3)',
          backgroundColor: 'rgba(0, 135, 202, 0.03)'
        }}
      />

      {/* Números de columna (opcional) */}
      <div 
        className="absolute top-0 pointer-events-none"
        style={{
          left: pan.x + (GRID_SIZE * zoom),
          transform: `translateY(${pan.y}px)`
        }}
      >
        {Array.from({ length: GRID_LIMITS.maxColumns - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-xs text-gray-500"
            style={{
              left: i * GRID_SIZE * zoom,
              width: GRID_SIZE * zoom,
              textAlign: 'center'
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </>
  )}

  {/* Canvas */}
  <EditorCanvas
    state={{
      seats,
      sections,
      selectedSeats,
      activeSectionId,
      tool,
      zoom,
      pan,
    }}
    bounds={{
      width: containerRef.current?.clientWidth || 0,
      height: containerRef.current?.clientHeight || 0
    }}
    showGrid={showGrid}
    onSeatAdd={handleSeatAdd}
    onSeatSelect={setSelectedSeats}
    onSeatsUpdate={(updates, seatIds) => {
      setSeats(prev => prev.map(seat => 
        (!seatIds || seatIds.includes(seat.id))
          ? { ...seat, ...updates }
          : seat
      ));
      setHasUnsavedChanges(true);
    }}
    onSectionSelect={setActiveSectionId}
    onDeleteSeat={(seatId) => {
      setSeats(prev => prev.filter(seat => seat.id !== seatId));
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
      setHasUnsavedChanges(true);
    }}
  />
</div>
        {/* Notificaciones y mensajes de estado */}
        <AnimatePresence>
          {/* Errores */}
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-24 right-4 left-4 lg:left-auto lg:w-96 z-50"
            >
              <Card className="bg-white/95 backdrop-blur p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-600 mb-2">
                      Errores encontrados
                    </h4>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setErrors([])}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
  
          {/* Cambios sin guardar */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-4 left-4 z-50"
            >
              <Card className="bg-white/95 backdrop-blur">
                <div className="p-3 flex items-center gap-3">
                  <Save className="h-4 w-4 text-[#0087ca]" />
                  <span className="text-sm text-gray-600">
                    Cambios sin guardar
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-[#0087ca] hover:bg-[#0087ca]/90 text-white"
                  >
                    Guardar cambios
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  

{/* Sidebar mejorado */}
<AnimatePresence mode="wait">
  {isSidebarOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed lg:absolute right-0 top-0 h-full w-[85%] sm:w-[400px] lg:w-[320px] bg-white shadow-lg z-40"
    >
      {/* Header del sidebar */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#7C3AED]/5 to-white backdrop-blur">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-[#7C3AED]" />
          <h3 className="font-semibold text-lg text-gray-800">Configuración de Secciones</h3>
        </div>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 hover:bg-[#EDE9FE] rounded-full transition-colors"
          title="Cerrar panel de configuración"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Contenido del sidebar con scroll */}
      <div className="h-[calc(100%-64px)] overflow-auto bg-gradient-to-b from-white to-[#EDE9FE]/20">
        <div className="p-4 space-y-4">
          <Sidebar
            sections={sections}
            activeSectionId={activeSectionId}
            selectedSeats={selectedSeats}
                onSectionSelect={(sectionId) => {
                  setActiveSectionId(sectionId);
                  setTool('DRAW');
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                onSectionUpdate={(sectionId, updates) => {
                  setSections(prev => prev.map(section =>
                    section.id === sectionId ? { ...section, ...updates } : section
                  ));
                  setHasUnsavedChanges(true);
                }}
                onBulkSeatUpdate={(updates) => {
                  setSeats(prev => {
                    const newSeats = [...prev];
                    selectedSeats.forEach(seatId => {
                      const seatIndex = newSeats.findIndex(s => s.id === seatId);
                      if (seatIndex !== -1) {
                        newSeats[seatIndex] = { 
                          ...newSeats[seatIndex], 
                          ...updates,
                          status: updates.status as SeatStatus
                        };
                      }
                    });
                    return newSeats;
                  });
                  setHasUnsavedChanges(true);
                }}
                onSectionDelete={(sectionId) => {
                  if (window.confirm('¿Estás seguro de eliminar esta sección?')) {
                    setSeats(prev => prev.filter(seat => seat.sectionId !== sectionId));
                    setSections(prev => prev.filter(section => section.id !== sectionId));
                    if (activeSectionId === sectionId) {
                      setActiveSectionId(null);
                    }
                    setHasUnsavedChanges(true);
                  }
                }}
                onCreateSection={(type) => {
                  const newSection: EditorSection = {
                    id: `section-${Date.now()}`,
                    name: type === 'VIP' ? 'Sección VIP' : 'Sección Regular',
                    type,
                    color: type === 'VIP' ? '#FF4444' : '#3B82F6',
                    price: type === 'VIP' ? 2000 : 1000,
                    rowStart: 0,
                    rowEnd: 0,
                    columnStart: 0,
                    columnEnd: 0
                  };
                  setSections(prev => [...prev, newSection]);
                  setActiveSectionId(newSection.id);
                  setTool('DRAW');
                }}
           />
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* Botón flotante para abrir/cerrar el sidebar */}
<button
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className={`
    fixed z-40 shadow-lg hover:shadow-xl
    flex items-center gap-2 rounded-lg
    transition-all duration-300 ease-in-out
    ${isSidebarOpen 
      ? 'right-[330px] top-24 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2' 
      : 'right-4 top-24 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5'
    }
  `}
>
  {isSidebarOpen ? (
    <>
      <ChevronRight className="h-5 w-5" />
      <span className="text-sm font-medium hidden sm:inline">
        Ocultar panel
      </span>
    </>
  ) : (
    <>
      <Settings2 className="h-5 w-5" />
      <span className="text-sm font-medium hidden sm:inline">
        Configurar mapa
      </span>
    </>
  )}
</button>

{/* Botón alternativo para móvil */}
<button
  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  className={`
    fixed lg:hidden z-40 
    right-4 bottom-20 
    p-3 rounded-full
    shadow-lg hover:shadow-xl
    transition-all duration-300
    ${isSidebarOpen 
      ? 'bg-white text-[#7C3AED]' 
      : 'bg-[#7C3AED] text-white'
    }
  `}
>
  <Settings2 className="h-6 w-6" />
</button>
    </div>
  );
  };

export default SeatingMapEditor;