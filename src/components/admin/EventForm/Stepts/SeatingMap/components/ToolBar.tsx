import { EditorState } from "../types";

// components/admin/EventForm/steps/SeatingMap/components/Toolbar.tsx
interface ToolbarProps {
    tool: EditorState['tool'];
    onToolChange: (tool: EditorState['tool']) => void;
    onDelete: () => void;
    hasSelection: boolean;
  }
  
  export const Toolbar: React.FC<ToolbarProps> = ({
    tool,
    onToolChange,
    onDelete,
    hasSelection
  }) => {
    const tools = [
      { id: 'SELECT' as const, icon: '⭐', label: 'Seleccionar' },
      { id: 'DRAW' as const, icon: '✏️', label: 'Dibujar' },
      { id: 'ERASE' as const, icon: '🗑️', label: 'Borrar' }
    ];
  
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-white rounded-lg shadow-lg p-1">
        {tools.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onToolChange(id)}
            className={`p-2 rounded ${
              tool === id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title={label}
          >
            {icon}
          </button>
        ))}
        
        <div className="w-px bg-gray-200" />
        
        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className={`p-2 rounded ${
            hasSelection 
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          title="Eliminar seleccionados"
        >
          🗑️
        </button>
      </div>
    );
  };