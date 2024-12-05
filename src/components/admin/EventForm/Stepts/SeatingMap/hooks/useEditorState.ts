// components/admin/EventForm/steps/SeatingMap/hooks/useEditorState.ts
import { useReducer, useCallback } from 'react';
import { EditorState, Point, EditorSection } from '../types';
import { EditorSeat } from '@/types/editor';

type EditorAction =
  | { type: 'ADD_SEAT'; seat: EditorSeat }
  | { type: 'REMOVE_SEATS'; seatIds: string[] }
  | { type: 'UPDATE_SEATS'; seats: EditorSeat[] }
  | { type: 'SET_SELECTION'; seatIds: string[] }
  | { type: 'SET_TOOL'; tool: EditorState['tool'] }
  | { type: 'SET_ACTIVE_SECTION'; sectionId: string | null }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; pan: Point }
  | { type: 'SET_SECTIONS'; sections: EditorSection[] };

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'ADD_SEAT':
      return {
        ...state,
        seats: [...state.seats, action.seat]
      };
    
    case 'REMOVE_SEATS':
      return {
        ...state,
        seats: state.seats.filter(seat => !action.seatIds.includes(seat.id)),
        selectedSeats: state.selectedSeats.filter(id => !action.seatIds.includes(id))
      };
    
    case 'UPDATE_SEATS':
      return {
        ...state,
        seats: state.seats.map(seat => {
          const updatedSeat = action.seats.find(s => s.id === seat.id);
          return updatedSeat || seat;
        })
      };
    
    case 'SET_SELECTION':
      return {
        ...state,
        selectedSeats: action.seatIds
      };
    
    case 'SET_TOOL':
      return {
        ...state,
        tool: action.tool,
        selectedSeats: [] // Clear selection when changing tools
      };
    
    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        activeSectionId: action.sectionId
      };
    
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: Math.min(Math.max(action.zoom, 0.1), 5)
      };
    
    case 'SET_PAN':
      return {
        ...state,
        pan: action.pan
      };

    case 'SET_SECTIONS':
      return {
        ...state,
        sections: action.sections
      };
    
    default:
      return state;
  }
};

export const useEditorState = (initialState: Partial<EditorState> = {}) => {
  const [state, dispatch] = useReducer(editorReducer, {
    seats: [],
    sections: [], // Inicializamos sections
    selectedSeats: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    tool: 'SELECT',
    activeSectionId: null,
    ...initialState
  });

  const actions = {
    addSeat: useCallback((seat: EditorSeat) => {
      dispatch({ type: 'ADD_SEAT', seat });
    }, []),

    removeSeats: useCallback((seatIds: string[]) => {
      dispatch({ type: 'REMOVE_SEATS', seatIds });
    }, []),

    updateSeats: useCallback((seats: EditorSeat[]) => {
      dispatch({ type: 'UPDATE_SEATS', seats });
    }, []),

    setSelection: useCallback((seatIds: string[]) => {
      dispatch({ type: 'SET_SELECTION', seatIds });
    }, []),

    setTool: useCallback((tool: EditorState['tool']) => {
      dispatch({ type: 'SET_TOOL', tool });
    }, []),

    setActiveSection: useCallback((sectionId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_SECTION', sectionId });
    }, []),

    setZoom: useCallback((zoom: number) => {
      dispatch({ type: 'SET_ZOOM', zoom });
    }, []),

    setPan: useCallback((pan: Point) => {
      dispatch({ type: 'SET_PAN', pan });
    }, []),

    setSections: useCallback((sections: EditorSection[]) => {
      dispatch({ type: 'SET_SECTIONS', sections });
    }, [])
  };

  return { state, actions };
};