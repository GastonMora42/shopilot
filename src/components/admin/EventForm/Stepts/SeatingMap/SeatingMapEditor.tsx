import React, { FC, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EditorSeat, 
  EditorSection, 
  SeatingMapEditorProps,
  ValidationError,
  ValidationResult,
  Point, 
  SeatStatus
} from '@/types/editor';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/ToolBar';
import { Sidebar } from './components/Sidebar';
import { ZoomControls } from './components/ZoomControls';
import { Tooltip } from '@/components/ui/ToolTip';

const GRID_SIZE = 30;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const DRAWING_TOOLTIP = {
  SELECT: 'Selecciona y mueve asientos haciendo click o arrastrando',
  DRAW: 'Haz click o arrastra para dibujar múltiples asientos',
  ERASE: 'Selecciona asientos y presiona eliminar o usa esta herramienta'
};

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
  const [tool, setTool] = useState<'SELECT' | 'DRAW' | 'ERASE'>('SELECT');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [showDrawingHelp, setShowDrawingHelp] = useState(true);
  // Validaciones

  const validateLayout = (): ValidationResult => {
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
  };

  // Manejo de secciones
  const handleCreateSection = (type: 'REGULAR' | 'VIP') => {
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
    setShowDrawingHelp(true);
  };

  // Manejo de asientos
  const handleSeatAdd = (seatData: Partial<EditorSeat>) => {
    if (!activeSectionId) return;

    const existingSeat = seats.find(
      seat => seat.row === seatData.row && seat.column === seatData.column
    );
    if (existingSeat) return;

    const newSeat: EditorSeat = {
      id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      row: seatData.row || 0,
      column: seatData.column || 0,
      sectionId: activeSectionId,
      status: 'AVAILABLE',
      label: `R${seatData.row! + 1}C${seatData.column! + 1}`,
      position: {
        x: (seatData.column || 0) * GRID_SIZE,
        y: (seatData.row || 0) * GRID_SIZE
      },
      screenPosition: {
        x: (seatData.column || 0) * GRID_SIZE,
        y: (seatData.row || 0) * GRID_SIZE
      }
    };

    setSeats(prev => [...prev, newSeat]);
    setHasUnsavedChanges(true);
  };

  // Manejo de zoom y pan
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom)));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    const validation = validateLayout();
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
  
    // Ajustar dimensiones automáticamente
    const maxRow = Math.max(...seats.map(s => s.row)) + 1;
    const maxCol = Math.max(...seats.map(s => s.column)) + 1;
  
    // Preparar datos para guardar
    const layoutData = {
      seats,
      sections,
      rows: maxRow,
      columns: maxCol
    };
  
    try {
      if (onSave) {
        await onSave();
        onChange(layoutData);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrors([{ 
        type: 'SAVE_ERROR', 
        message: 'Error al guardar el mapa de asientos' 
      }]);
    }
  };

 // En el SeatingMapEditor, añade estas funciones:

// Para manejar el borrado de asientos
const handleDelete = () => {
  if (selectedSeats.length === 0) return;
  
  setSeats(prev => prev.filter(seat => !selectedSeats.includes(seat.id)));
  setSelectedSeats([]);
  setHasUnsavedChanges(true);
};

// Para validar antes de continuar
const validateBeforeNext = (): boolean => {
  // Validar que haya secciones y asientos
  if (sections.length === 0) {
    setErrors([{
      type: 'NO_SECTIONS',
      message: 'Debe crear al menos una sección'
    }]);
    return false;
  }

  // Validar que cada sección tenga asientos
  for (const section of sections) {
    const sectionSeats = seats.filter(seat => seat.sectionId === section.id);
    if (sectionSeats.length === 0) {
      setErrors([{
        type: 'EMPTY_SECTION',
        message: `La sección "${section.name}" no tiene asientos asignados`
      }]);
      return false;
    }
  }

  // Calcular dimensiones reales
  const maxRow = Math.max(...seats.map(s => s.row)) + 1;
  const maxCol = Math.max(...seats.map(s => s.column)) + 1;

  // Actualizar secciones con dimensiones correctas
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

  // Preparar datos finales
  const layoutData = {
    seats: seats.map(seat => ({
      ...seat,
      section: sections.find(s => s.id === seat.sectionId)?.name || '',
    })),
    sections: updatedSections,
    rows: maxRow,
    columns: maxCol
  };

  // Actualizar estado y notificar cambios
  setSections(updatedSections);
  onChange(layoutData);
  setHasUnsavedChanges(false);
  return true;
};

// Actualiza el renderizado del toolbar

// En el componente padre (EventForm o similar), maneja la continuación
const handleNext = () => {
  const isValid = validateBeforeNext();
  if (isValid) {
    // Continuar al siguiente paso
    setCurrentStep('NEXT_STEP');
  }
};

// Actualiza el botón de siguiente/continuar
  return (
    <div className="relative flex h-full" ref={containerRef}>
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        {/* Editor Canvas */}
        <EditorCanvas
          state={{
            seats,
            sections,
            selectedSeats,
            activeSectionId,
            tool,
            zoom,
            pan
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
        />

        {/* Toolbar */}
        <Toolbar
  tool={tool}
  onToolChange={setTool}
  onDelete={handleDelete}
  hasSelection={selectedSeats.length > 0}
  selectedCount={selectedSeats.length}
  onSave={hasUnsavedChanges ? validateBeforeNext : undefined}
/>


        {/* Zoom Controls */}
        <ZoomControls
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onReset={handleResetView}
        />

        {/* Drawing Help Tooltip */}
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

        {/* Error Messages */}
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

          {/* Unsaved Changes Message */}
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
    const validatedUpdates = {
      ...updates,
      status: updates.status as SeatStatus
    };
  
    setSeats(prev => {
      const newSeats = [...prev];
      selectedSeats.forEach(seatId => {
        const seatIndex = newSeats.findIndex(s => s.id === seatId);
        if (seatIndex !== -1) {
          newSeats[seatIndex] = { 
            ...newSeats[seatIndex], 
            ...validatedUpdates 
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

function setCurrentStep(arg0: string) {
  throw new Error('Function not implemented.');
}
