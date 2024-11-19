// components/admin/EventForm/steps/SeatingMap/hooks/useSeatingMap.ts
import { useState, useCallback } from 'react';
import { Seat, Point } from '../types';
import { Section } from "../../SeatedTickets/types";

// Extendemos Section para crear EditorSection
export interface EditorSection extends Section {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  color: string;
}

// Función helper para convertir Section a EditorSection
const convertToEditorSection = (section: Section): EditorSection => ({
  ...section,
  rowStart: (section as any).rowStart || 1,
  rowEnd: (section as any).rowEnd || 1,
  columnStart: (section as any).columnStart || 1,
  columnEnd: (section as any).columnEnd || 1,
  color: (section as any).color || '#000000'
});

export const useSeatingMap = (initialSections: Section[] = []) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [sections, setSections] = useState<EditorSection[]>(
    initialSections.map(convertToEditorSection)
  );
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const addSeat = useCallback((seatData: Omit<Seat, 'id'>) => {
    const newSeat: Seat = {
      ...seatData,
      id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setSeats(prev => [...prev, newSeat]);
  }, []);

  const updateSeats = useCallback((updates: Partial<Seat>, seatIds?: string[]) => {
    setSeats(prev => prev.map(seat => 
      (!seatIds || seatIds.includes(seat.id))
        ? { ...seat, ...updates }
        : seat
    ));
  }, []);

  const removeSeats = useCallback((seatIds: string[]) => {
    setSeats(prev => prev.filter(seat => !seatIds.includes(seat.id)));
    setSelectedSeats(prev => prev.filter(id => !seatIds.includes(id)));
  }, []);

  const updateSection = useCallback((sectionId: string, updates: Partial<EditorSection>) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, ...updates }
        : section
    ));
  }, []);

  return {
    seats,
    sections,
    selectedSeats,
    activeSectionId,
    actions: {
      addSeat,
      updateSeats,
      removeSeats,
      updateSection,
      setSelectedSeats,
      setActiveSectionId
    }
  };
};
