// components/admin/EventForm/steps/SeatingMap/utils/transform.ts
export const transformUtils = {
    screenToWorld: (point: Point, pan: Point, zoom: number): Point => ({
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom
    }),
  
    worldToScreen: (point: Point, pan: Point, zoom: number): Point => ({
      x: point.x * zoom + pan.x,
      y: point.y * zoom + pan.y
    }),
  
    snapToGrid: (point: Point, gridSize: number): Point => ({
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    })
  };
  
  // components/admin/EventForm/steps/SeatingMap/utils/selection.ts
  export const selectionUtils = {
    isPointInRect: (point: Point, rect: { start: Point; end: Point }): boolean => {
      const minX = Math.min(rect.start.x, rect.end.x);
      const maxX = Math.max(rect.start.x, rect.end.x);
      const minY = Math.min(rect.start.y, rect.end.y);
      const maxY = Math.max(rect.start.y, rect.end.y);
  
      return (
        point.x >= minX &&
        point.x <= maxX &&
        point.y >= minY &&
        point.y <= maxY
      );
    },
  
    getSeatsInSelection: (seats: Seat[], selectionRect: { start: Point; end: Point }): string[] => {
      return seats
        .filter(seat => selectionUtils.isPointInRect(seat.position, selectionRect))
        .map(seat => seat.id);
    }
  };
  
  // components/admin/EventForm/steps/SeatingMap/hooks/useEditorState.ts
  import { useReducer, useCallback } from 'react';
  import { EditorState, Seat, Point } from '../types';
  
  type EditorAction =
    | { type: 'ADD_SEAT'; seat: Seat }
    | { type: 'REMOVE_SEATS'; seatIds: string[] }
    | { type: 'UPDATE_SEATS'; seats: Seat[] }
    | { type: 'SET_SELECTION'; seatIds: string[] }
    | { type: 'SET_TOOL'; tool: EditorState['tool'] }
    | { type: 'SET_ACTIVE_SECTION'; sectionId: string | null }
    | { type: 'SET_ZOOM'; zoom: number }
    | { type: 'SET_PAN'; pan: Point };
  
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
      
      default:
        return state;
    }
  };
  
  export const useEditorState = (initialState: Partial<EditorState> = {}) => {
    const [state, dispatch] = useReducer(editorReducer, {
      seats: [],
      selectedSeats: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      tool: 'SELECT',
      activeSectionId: null,
      ...initialState
    });
  
    const actions = {
      addSeat: useCallback((seat: Seat) => {
        dispatch({ type: 'ADD_SEAT', seat });
      }, []),
  
      removeSeats: useCallback((seatIds: string[]) => {
        dispatch({ type: 'REMOVE_SEATS', seatIds });
      }, []),
  
      updateSeats: useCallback((seats: Seat[]) => {
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
      }, [])
    };
  
    return { state, actions };
  };