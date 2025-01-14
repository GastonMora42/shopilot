import React from 'react';
import { EditorState } from "../types";
import { Tooltip } from '@/components/ui/ToolTip';

interface ToolbarProps {
  tool: EditorState['tool'];
  onToolChange: (tool: EditorState['tool']) => void;
  onDelete: () => void;
  hasSelection: boolean;
  selectedCount?: number;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  onDelete,
  hasSelection,
  selectedCount = 0,
  onSave,
  onUndo,
  onRedo
}) => {
  const mainTools = [
    {
      id: 'SELECT' as const,
      icon: '🖱️',
      label: 'Seleccionar',
      shortcut: '(V)',
      description: 'Haz clic para seleccionar o arrastra para selección múltiple'
    },
    {
      id: 'DRAW' as const,
      icon: '✏️',
      label: 'Dibujar',
      shortcut: '(D)',
      description: 'Haz clic o arrastra para dibujar múltiples asientos'
    }
  ];

  const editTools = [
    {
      id: 'ERASE' as const,
      icon: '🗑️',
      label: 'Borrar',
      shortcut: '(E)',
      description: 'Selecciona asientos y presiona Delete para eliminar'
    }
  ];

  const handleDelete = () => {
    if (!hasSelection) return;
    
    if (selectedCount > 1) {
      const confirm = window.confirm(`¿Estás seguro de eliminar ${selectedCount} asientos?`);
      if (!confirm) return;
    }
    
    onDelete();
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50">
      <div className="flex items-stretch bg-white rounded-lg shadow-lg p-2 space-x-2">
        {/* Herramientas principales */}
        <div className="flex space-x-2">
          {mainTools.map(({ id, icon, label, shortcut, description }) => (
            <Tooltip
              key={id}
              content={
                <div className="text-sm">
                  <div className="font-medium">{label}</div>
                  <div className="text-gray-200 text-xs">{description}</div>
                  <div className="mt-1 text-xs opacity-75">Atajo: {shortcut}</div>
                </div>
              }
            >
              <button
                onClick={() => onToolChange(id)}
                className={`
                  p-2 rounded-md transition-all duration-200
                  flex flex-col items-center min-w-[60px]
                  ${tool === id 
                    ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-2' 
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl mb-1">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="w-px self-stretch bg-gray-200" />

        {/* Herramientas de edición */}
        <div className="flex space-x-2">
          {editTools.map(({ id, icon, label, shortcut, description }) => (
            <Tooltip
              key={id}
              content={
                <div className="text-sm">
                  <div className="font-medium">{label}</div>
                  <div className="text-gray-200 text-xs">{description}</div>
                  <div className="mt-1 text-xs opacity-75">Atajo: {shortcut}</div>
                </div>
              }
            >
              <button
                onClick={() => onToolChange(id)}
                className={`
                  p-2 rounded-md transition-all duration-200
                  flex flex-col items-center min-w-[60px]
                  ${tool === id 
                    ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-2' 
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl mb-1">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="w-px self-stretch bg-gray-200" />

        {/* Acciones */}
        <div className="flex items-center space-x-2">
          {onUndo && onRedo && (
            <>
              <Tooltip content="Deshacer (Ctrl+Z)">
                <button
                  onClick={onUndo}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">↩️</span>
                </button>
              </Tooltip>
              <Tooltip content="Rehacer (Ctrl+Y)">
                <button
                  onClick={onRedo}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">↪️</span>
                </button>
              </Tooltip>
              <div className="w-px self-stretch bg-gray-200" />
            </>
          )}

          {hasSelection && (
            <Tooltip content={`Eliminar ${selectedCount} asiento${selectedCount > 1 ? 's' : ''} (Del)`}>
              <button
                onClick={handleDelete}
                className="p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-1"
              >
                <span className="text-xl">🗑️</span>
                {selectedCount > 0 && (
                  <span className="text-sm font-medium">({selectedCount})</span>
                )}
              </button>
            </Tooltip>
          )}

          {onSave && (
            <>
              <div className="w-px self-stretch bg-gray-200" />
              <Tooltip content="Guardar cambios (Ctrl+S)">
                <button
                  onClick={onSave}
                  className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <span className="text-xl">💾</span>
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* Opciones de dibujo */}
      {tool === 'DRAW' && (
        <div className="mt-2 bg-white rounded-lg shadow-lg p-2 animate-fadeIn">
          <div className="text-xs text-gray-500 mb-2">Pro tip: Arrastra para dibujar múltiples asientos</div>
          <div className="flex items-center space-x-2 text-sm">
            <button className="px-3 py-1.5 rounded-md hover:bg-gray-100 flex items-center space-x-1">
              <span>🔢</span>
              <span>Auto-numerar</span>
            </button>
            <button className="px-3 py-1.5 rounded-md hover:bg-gray-100 flex items-center space-x-1">
              <span>↔️</span>
              <span>Espaciado</span>
            </button>
            <button className="px-3 py-1.5 rounded-md hover:bg-gray-100 flex items-center space-x-1">
              <span>🔄</span>
              <span>Rotación</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};