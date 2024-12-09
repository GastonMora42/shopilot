// components/admin/EventForm/steps/SeatingMap/components/Toolbar.tsx
import React from 'react';
import { EditorState } from "../types";

interface ToolbarProps {
  tool: EditorState['tool'];
  onToolChange: (tool: EditorState['tool']) => void;
  onDelete: () => void;
  hasSelection: boolean;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  onDelete,
  hasSelection,
  onSave,
  onUndo,
  onRedo
}) => {
  const tools = [
    { 
      id: 'SELECT' as const, 
      icon: '🖱️', 
      label: 'Seleccionar',
      shortcut: '(V)'
    },
    { 
      id: 'DRAW' as const, 
      icon: '✏️', 
      label: 'Dibujar',
      shortcut: '(D)'
    },
    { 
      id: 'ERASE' as const, 
      icon: '🗑️', 
      label: 'Borrar',
      shortcut: '(E)'
    }
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2">
      {tools.map(({ id, icon, label, shortcut }) => (
        <button
          key={id}
          onClick={() => onToolChange(id)}
          className={`p-2 rounded flex items-center space-x-2 ${
            tool === id 
              ? 'bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-100'
          }`}
          title={`${label} ${shortcut}`}
        >
          <span>{icon}</span>
          <span className="text-sm hidden md:inline">{label}</span>
        </button>
      ))}
      
      <div className="w-px h-6 bg-gray-200" />
      
      {onUndo && onRedo && (
        <>
          <button
            onClick={onUndo}
            className="p-2 rounded hover:bg-gray-100"
            title="Deshacer (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            onClick={onRedo}
            className="p-2 rounded hover:bg-gray-100"
            title="Rehacer (Ctrl+Y)"
          >
            ↪️
          </button>
          <div className="w-px h-6 bg-gray-200" />
        </>
      )}
      
      <button
        onClick={onDelete}
        disabled={!hasSelection}
        className={`p-2 rounded ${
          hasSelection 
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="Eliminar seleccionados (Del)"
      >
        🗑️
      </button>
      
      {onSave && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={onSave}
            className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            title="Guardar (Ctrl+S)"
          >
            💾
          </button>
        </>
      )}
    </div>
  );
};