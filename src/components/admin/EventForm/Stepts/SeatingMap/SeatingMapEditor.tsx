import React, { FC, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/ToolBar';
import { ZoomControls } from './components/ZoomControls';
import { Sidebar } from './components/Sidebar';
import { TemplateSelectorProps } from '@/types/editor';
import { useEditorState } from './hooks/useEditorState';
import { useSeatingMap } from './hooks/useSeatingMap';
import { EditorSeat, EditorSection, SeatingMapEditorProps } from '@/types/editor';
import { seatingTemplates } from './templates/layout';
import { TemplateSelector } from './components/TemplateSelector';
import { validateSeatingLayout, ValidationError } from './validations/seatingRules';

const GRID_SIZE = 30;
const DEBOUNCE_DELAY = 500;

interface ViewportBounds {
  width: number;
  height: number;
}

export const SeatingMapEditor: FC<SeatingMapEditorProps> = ({
  initialSections,
  initialSeats,
  onChange,
  onSave
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<ViewportBounds>({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [showTemplateSelector, setShowTemplateSelector] = useState(true); // Cambiar a true por defecto
  const processedInitialSections = useMemo(() => {
    return initialSections.map((section: EditorSection) => ({
      ...section,
      rowStart: section.rowStart || 1,
      rowEnd: section.rowEnd || 1,
      columnStart: section.columnStart || 1,
      columnEnd: section.columnEnd || 1,
    }));
  }, [initialSections]);

  const processedInitialSeats = useMemo(() => {
    return initialSeats.map((seat: EditorSeat) => ({
      ...seat,
      label: seat.label || `R${seat.row}C${seat.column}`,
      position: seat.position || {
        x: (seat.column || 0) * GRID_SIZE,
        y: (seat.row || 0) * GRID_SIZE
      },
      screenPosition: seat.screenPosition || {
        x: (seat.column || 0) * GRID_SIZE,
        y: (seat.row || 0) * GRID_SIZE
      }
    }));
  }, [initialSeats]);

  const { state, actions } = useEditorState({
    seats: processedInitialSeats,
    sections: processedInitialSections,
    zoom: 1,
    pan: { x: 0, y: 0 },
    tool: 'SELECT',
    selectedSeats: [],
    activeSectionId: initialSections[0]?.id || null
  });

  const {
    seats,
    sections,
    selectedSeats,
    activeSectionId,
    actions: mapActions
  } = useSeatingMap(processedInitialSections);

  const createNewSeat = (seatData: Partial<EditorSeat>): EditorSeat => ({
    id: seatData.id || `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    row: seatData.row || 0,
    column: seatData.column || 0,
    sectionId: seatData.sectionId || state.activeSectionId || '',
    status: 'ACTIVE',
    label: seatData.label || `R${seatData.row}C${seatData.column}`,
    position: {
      x: (seatData.column || 0) * GRID_SIZE,
      y: (seatData.row || 0) * GRID_SIZE
    },
    screenPosition: seatData.screenPosition || {
      x: (seatData.column || 0) * GRID_SIZE,
      y: (seatData.row || 0) * GRID_SIZE
    }
  });

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        setBounds({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    if (processedInitialSections.length > 0 && !state.activeSectionId) {
      actions.setActiveSection(processedInitialSections[0].id);
    }

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [processedInitialSections, state.activeSectionId, actions]);

  const debouncedOnChange = useRef(
    debounce((seats: EditorSeat[], sections: EditorSection[]) => {
      onChange({
        seats,
        sections,
        rows: Math.max(...seats.map(s => s.row)) + 1,
        columns: Math.max(...seats.map(s => s.column)) + 1
      });
      setHasUnsavedChanges(true);
    }, DEBOUNCE_DELAY)
  ).current;

  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  useEffect(() => {
    debouncedOnChange(seats, sections);
  }, [seats, sections]);

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ['s', 'v', 'd', 'e'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      
      if (e.key.toLowerCase() === 's') {
        handleSave();
        return;
      }

      const toolMap = {
        v: 'SELECT',
        d: 'DRAW',
        e: 'ERASE'
      } as const;

      actions.setTool(toolMap[e.key.toLowerCase() as keyof typeof toolMap]);
    }

    if (e.key === 'Delete' && selectedSeats.length > 0) {
      mapActions.removeSeats(selectedSeats);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [selectedSeats]);

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setIsSaving(true);
      await onSave();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error al guardar el diseño:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleValidate = () => {
    const errors = validateSeatingLayout({
      seats: state.seats,
      sections: state.sections,
      rows: Math.max(...state.seats.map(s => s.row)) + 1,
      columns: Math.max(...state.seats.map(s => s.column)) + 1
    });
  
    setValidationErrors(errors);
    return errors.length === 0;
  };

  return (
    <div className="relative flex h-full" ref={containerRef}>
      {showTemplateSelector ? (
        <TemplateSelector
          onSelect={(template) => {
            actions.setSections(template.sections);
            setShowTemplateSelector(false);
          }}
          onCustomLayout={() => setShowTemplateSelector(false)}
        />
      ) : (
        <>
          <div className="flex-1 relative overflow-hidden bg-gray-50">
            <EditorCanvas
              state={{
                ...state,
                sections: sections || []
              }}
              bounds={bounds}
              onSeatAdd={(seatData) => {
                mapActions.addSeat(createNewSeat(seatData));
              }}
              onSeatSelect={mapActions.setSelectedSeats}
              onSeatsUpdate={mapActions.updateSeats}
              onSectionSelect={actions.setActiveSection}
            />
  
            <Toolbar
              tool={state.tool}
              onToolChange={actions.setTool}
              onDelete={() => mapActions.removeSeats(selectedSeats)}
              hasSelection={selectedSeats.length > 0}
            />

            <ZoomControls
              zoom={state.zoom}
              onZoomChange={actions.setZoom}
              onReset={() => {
                actions.setZoom(1);
                actions.setPan({ x: 0, y: 0 });
              }}
            />
{validationErrors.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4"
  >
    <h4 className="text-red-600 font-medium mb-2">
      Errores encontrados ({validationErrors.length}):
    </h4>
    <div className="max-h-60 overflow-y-auto">
      {validationErrors.map((error, index) => (
        <div 
          key={index}
          className="p-2 mb-2 bg-red-50 rounded text-sm text-red-600"
        >
          {error.message}
        </div>
      ))}
    </div>
  </motion.div>
)}
            <AnimatePresence>
              {hasUnsavedChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2"
                >
                  <span className="text-sm text-gray-600">
                    {isSaving ? 'Guardando...' : 'Cambios sin guardar'}
                  </span>
                  {!isSaving && (
                    <button
                      onClick={handleSave}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Guardar
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Sidebar
            sections={sections}
            activeSectionId={activeSectionId}
            selectedSeats={selectedSeats}
            onSectionSelect={(sectionId) => {
              actions.setActiveSection(sectionId);
              if (state.tool !== 'DRAW') {
                actions.setTool('DRAW');
              }
            }}
            onSectionUpdate={mapActions.updateSection}
            onBulkSeatUpdate={(updates) => {
              mapActions.updateSeats(updates, selectedSeats);
            }}
          />
        </>
      )}
    </div>
  );
};