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

const GRID_SIZE = 30;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

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
  // Componente de Configuración de Espaciado
  const SpacingSettings = useCallback(() => {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-50"
      >
        <h3 className="text-sm font-medium mb-3">Configuración de espaciado</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Espacio entre filas
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={spacing.rows}
              onChange={e => setSpacing(prev => ({
                ...prev,
                rows: Math.max(1, Math.min(5, parseInt(e.target.value) || 1))
              }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Espacio entre columnas
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={spacing.columns}
              onChange={e => setSpacing(prev => ({
                ...prev,
                columns: Math.max(1, Math.min(5, parseInt(e.target.value) || 1))
              }))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </motion.div>
    );
  }, [spacing]);

  // Funciones de validación
  const validateLayout = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (sections.length === 0) {
      errors.push({
        type: 'NO_SECTIONS',
        message: 'Debe crear al menos una sección'
      });
    }

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

  const handleMarkEmptySpace = useCallback((row: number, column: number) => {
    setEmptySpaces(prev => {
      const exists = prev.some(space => space.x === row && space.y === column);
      if (exists) {
        return prev.filter(space => !(space.x === row && space.y === column));
      }
      return [...prev, { x: row, y: column }];
    });

    // Remover asiento si existe en esa posición
    setSeats(prev => prev.filter(seat => !(seat.row === row && seat.column === column)));
    setHasUnsavedChanges(true);
  }, []);

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
  return (
    <div className="relative flex h-full" ref={containerRef}>
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {/* Toolbar */}
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          onDelete={handleDelete}
          hasSelection={selectedSeats.length > 0}
          selectedCount={selectedSeats.length}
          onSave={hasUnsavedChanges ? validateBeforeNext : undefined}
          onSpacingClick={() => setShowSpacingSettings(!showSpacingSettings)}
        />

        {/* Configuración de espaciado */}
        <AnimatePresence>
          {showSpacingSettings && <SpacingSettings />}
        </AnimatePresence>

        {/* Editor Canvas */}
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
          showGrid={true}
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

        {/* Controles de zoom */}
        <ZoomControls
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onReset={handleResetView}
        />

        {/* Tooltip de ayuda */}
        <AnimatePresence>
          {showDrawingHelp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3"
            >
              <div className="text-sm text-gray-600 max-w-md">
                <p className="font-medium mb-1">Tip de dibujo:</p>
                <p>{DRAWING_TOOLTIP[tool]}</p>
              </div>
              <button
                onClick={() => setShowDrawingHelp(false)}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensajes de error */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4"
            >
              <h4 className="text-red-600 font-medium mb-2">
                Errores encontrados:
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {errors.map((error, index) => (
                  <div 
                    key={index}
                    className="p-2 bg-red-50 rounded text-sm text-red-600"
                  >
                    {error.message}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensaje de cambios sin guardar */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2"
            >
              <span className="text-sm text-gray-600">
                Hay cambios sin guardar
              </span>
              <button
                onClick={handleSave}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Guardar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
      <Sidebar
        sections={sections}
        activeSectionId={activeSectionId}
        selectedSeats={selectedSeats}
        onSectionSelect={(sectionId) => {
          setActiveSectionId(sectionId);
          setTool('DRAW');
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
  );
};

export default SeatingMapEditor;