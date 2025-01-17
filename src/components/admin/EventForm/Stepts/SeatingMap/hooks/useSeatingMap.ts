// hooks/useSeatingMap.ts
import { useState, useCallback } from 'react';
import { EditorSeat, EditorSection } from '@/types/editor';

export const useSeatingMap = (initialSections: EditorSection[] = []) => {
  const [seats, setSeats] = useState<EditorSeat[]>([]);
  const [sections, setSections] = useState<EditorSection[]>(initialSections);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const addSeat = useCallback((seatData: Omit<EditorSeat, 'id'>) => {
    const newSeat: EditorSeat = {
      ...seatData,
      id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setSeats(prev => [...prev, newSeat]);
  }, []);

  const updateSeats = useCallback((updates: Partial<EditorSeat>, seatIds?: string[]) => {
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