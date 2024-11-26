import React, { FC, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from './components/ToolBar';
import { ZoomControls } from './components/ZoomControls';
import { Sidebar } from './components/Sidebar';
import { useEditorState } from './hooks/useEditorState';
import { useSeatingMap } from './hooks/useSeatingMap';
import { EditorSeat, EditorSection, SeatingMapEditorProps } from '@/types/editor';

// Constantes
const GRID_SIZE = 30;
const DEBOUNCE_DELAY = 500;

// Tipos
export interface Point {
  x: number;
  y: number;
}


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
  // Referencias y estado
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<ViewportBounds>({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Procesar datos iniciales
  const processedInitialSections = useMemo(() => {
    return initialSections.map((section: EditorSection) => ({
      ...section,
      rowStart: section.rowStart || 1,
      rowEnd: section.rowEnd || 1,
      columnStart: section.columnStart || 1,
      columnEnd: section.columnEnd || 1,
    }));
  }, [initialSections]);

  // Procesar asientos iniciales
  const processedInitialSeats = useMemo(() => {
    return initialSeats.map((seat: EditorSeat) => ({
      ...seat,
      label: seat.label || `R${seat.row}C${seat.column}`,
      position: seat.position || {
        x: (seat.column || 0) * GRID_SIZE,
        y: (seat.row || 0) * GRID_SIZE
      }
    }));
  }, [initialSeats]);

  // Estado del editor
  const { state, actions } = useEditorState({
    seats: processedInitialSeats,
    zoom: 1,
    pan: { x: 0, y: 0 },
    tool: 'SELECT',
    selectedSeats: [],
    activeSectionId: null
  });

  // Estado del mapa de asientos
  const {
    seats,
    sections,
    selectedSeats,
    activeSectionId,
    actions: mapActions
  } = useSeatingMap(processedInitialSections);
  // Funciones auxiliares
  const calculateDimensions = (seats: EditorSeat[]) => {
    if (seats.length === 0) return { rows: 0, columns: 0 };
    return {
      rows: Math.max(...seats.map(s => s.row)) + 1,
      columns: Math.max(...seats.map(s => s.column)) + 1
    };
  };

  // Manejador de cambios con debounce
  const debouncedOnChange = useRef(
    debounce((seats: EditorSeat[], sections: EditorSection[]) => {
      const { rows, columns } = calculateDimensions(seats);
      onChange({
        seats,
        sections,
        rows,
        columns
      });
      setHasUnsavedChanges(true);
    }, DEBOUNCE_DELAY)
  ).current;

  // Efectos
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        setBounds({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    debouncedOnChange(seats, sections);
  }, [seats, sections, debouncedOnChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'v', 'd', 'e'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        handleSave();
      }

      if (e.key === 'Delete' && selectedSeats.length > 0) {
        mapActions.removeSeats(selectedSeats);
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          actions.setTool('SELECT');
          break;
        case 'd':
          actions.setTool('DRAW');
          break;
        case 'e':
          actions.setTool('ERASE');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSeats, mapActions, actions]);

  // Manejadores
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

  const createNewSeat = (seatData: Partial<EditorSeat>): EditorSeat => ({
    id: seatData.id || `seat-${Date.now()}`,
    row: seatData.row || 0,
    column: seatData.column || 0,
    sectionId: seatData.sectionId || '',
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


  return (
    <div className="relative flex h-full" ref={containerRef}>
      <div className="flex-1 relative overflow-hidden bg-gray-50">
        <EditorCanvas
          state={state}
          bounds={bounds}
          onSeatAdd={(seatData) => {
            mapActions.addSeat(createNewSeat(seatData));
          }}
          onSeatSelect={mapActions.setSelectedSeats}
          onSeatsUpdate={(updates, seatIds) => {
            mapActions.updateSeats(updates, seatIds);
          }}
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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 text-sm text-gray-600 flex gap-4">
        <span>⌘V: Seleccionar</span>
        <span>⌘D: Dibujar</span>
        <span>⌘E: Borrar</span>
        <span>⌘S: Guardar</span>
      </div>
    </div>
  );
};