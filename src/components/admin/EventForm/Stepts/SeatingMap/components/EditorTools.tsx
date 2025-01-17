// components/admin/EventForm/steps/SeatingMap/components/EditorTools.tsx
export const EditorTools = {
    SELECT: {
      icon: 'cursor',
      shortcuts: ['V'],
      modes: ['single', 'row', 'column', 'section']
    },
    DRAW: {
      icon: 'pen',
      shortcuts: ['D'],
      modes: ['single', 'row', 'continuous']
    },
    TRANSFORM: {
      icon: 'arrows',
      shortcuts: ['T'],
      operations: ['rotate', 'scale', 'move']
    }
  };