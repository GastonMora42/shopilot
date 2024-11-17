// components/admin/EventForm/steps/SeatingMap/SeatingMapEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorCanvas } from './components/EditorCanvas';
import { Toolbar } from '@/components/admin/EventForm/Stepts/SeatingMap/components/ToolBar';
import { ZoomControls } from './components/ZoomControls';
import { Sidebar } from '@/components/admin/EventForm/Stepts/SeatingMap/components/Sidebar';
import { useEditorState } from './hooks/useEditorState';
import { useSeatingMap } from './hooks/useSeatingMap';
import { Seat } from './types';
import { debounce } from 'lodash';
import { Section } from "../SeatedTickets/types";

interface SeatingMapEditorProps {
  initialSections: Section[];
  initialSeats?: Seat[];
  onChange: (layout: { seats: Seat[]; sections: Section[] }) => void;
  onSave?: () => Promise<void>;
}

export const SeatingMapEditor: React.FC<SeatingMapEditorProps> = ({
  initialSections,
  initialSeats = [],
  onChange,
  onSave
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize editor state
  const { state, actions } = useEditorState({
    seats: initialSeats,
    zoom: 1,
    pan: { x: 0, y: 0 },
    tool: 'SELECT',
    selectedSeats: [],
    activeSectionId: null
  });

  const {
    seats,
    sections,
    selectedSeats,
    activeSectionId,
    actions: mapActions
  } = useSeatingMap(initialSections);

  // Update bounds on resize
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
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Debounced change handler
  const debouncedOnChange = useRef(
    debounce((seats: Seat[], sections: Section[]) => {
      onChange({ seats, sections });
      setHasUnsavedChanges(true);
    }, 500)
  ).current;

  // Update parent component when seats or sections change
  useEffect(() => {
    debouncedOnChange(seats, sections);
  }, [seats, sections]);

  // Handle save
  const handleSave = async () => {
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave();
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error saving layout:', error);
        // You might want to show an error toast here
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      if (e.key === 'Delete' && selectedSeats.length > 0) {
        mapActions.removeSeats(selectedSeats);
      }

      // Tool shortcuts
      if (e.key === 'v') actions.setTool('SELECT');
      if (e.key === 'd') actions.setTool('DRAW');
      if (e.key === 'e') actions.setTool('ERASE');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSeats]);

  return (
    <div className="relative flex h-full" ref={containerRef}>
      <div className="flex-1 relative overflow-hidden">
        <EditorCanvas
          state={state}
          bounds={bounds}
          onSeatAdd={(seatData) => {
            mapActions.addSeat(seatData);
          }}
          onSeatSelect={(seatIds) => {
            mapActions.setSelectedSeats(seatIds);
          }}
  // Corregimos esta parte
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

        {/* Saving indicator */}
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

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 text-sm text-gray-600">
        <span className="mr-4">⌘V: Seleccionar</span>
        <span className="mr-4">⌘D: Dibujar</span>
        <span className="mr-4">⌘E: Borrar</span>
        <span>⌘S: Guardar</span>
      </div>
    </div>
  );
};

