import React from 'react';
import { EditorState } from "../types";
import { Tooltip } from '@/components/ui/ToolTip';
import { Card } from '@/components/ui/Card';
import { 
  MousePointerClick, 
  Pencil, 
  Trash2, 
  UndoIcon, 
  RedoIcon,
  Save,
  Maximize2,
  Grid,
  Settings
} from 'lucide-react';

interface ToolbarProps {
  tool: EditorState['tool'];
  onToolChange: (tool: EditorState['tool']) => void;
  onDelete: () => void;
  onSpacingClick?: () => void;
  hasSelection: boolean;
  selectedCount?: number;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  onToolChange,
  onDelete,
  hasSelection,
  selectedCount = 0,
  onSave,
  onUndo,
  onRedo,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onResetView,
  showGrid,
  onToggleGrid,
  onSpacingClick
}) => {
  // Definimos las herramientas con íconos modernos y mejor organización
  const mainTools = [
    {
      id: 'SELECT',
      icon: <MousePointerClick className="h-5 w-5" />,
      label: 'Seleccionar',
      shortcut: '(V)',
      description: 'Selecciona y mueve asientos',
      color: 'blue'
    },
    {
      id: 'DRAW',
      icon: <Pencil className="h-5 w-5" />,
      label: 'Dibujar',
      shortcut: '(D)',
      description: 'Dibuja asientos individuales o en grupo',
      color: 'green'
    },
    {
      id: 'ERASE',
      icon: <Trash2 className="h-5 w-5" />,
      label: 'Borrar',
      shortcut: '(E)',
      description: 'Elimina asientos',
      color: 'red'
    }
  ];

  return (
    <div className="sticky top-0 z-30 w-full bg-white border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col gap-2 py-2">
          {/* Barra principal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Herramientas principales */}
              <div className="flex gap-1">
                {mainTools.map(({ id, icon, label, shortcut, description, color }) => (
                  <Tooltip
                    key={id}
                    content={
                      <div className="text-sm">
                        <p className="font-medium">{label}</p>
                        <p className="text-gray-200 text-xs">{description}</p>
                        <p className="mt-1 text-xs opacity-75">Atajo: {shortcut}</p>
                      </div>
                    }
                  >
                    <button
                      onClick={() => onToolChange(id as EditorState['tool'])}
                      className={`
                        p-2 rounded-lg transition-all duration-200
                        flex items-center gap-2 min-w-[40px]
                        ${tool === id 
                          ? `bg-${color}-100 text-${color}-600 ring-2 ring-${color}-500 ring-offset-1` 
                          : 'hover:bg-gray-100'
                        }
                      `}
                    >
                      {icon}
                      <span className="hidden sm:block text-sm font-medium">
                        {label}
                      </span>
                    </button>
                  </Tooltip>
                ))}
              </div>

              {/* Separador */}
              <div className="h-8 w-px bg-gray-200" />

              {/* Estado y acciones contextuales */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Zoom: {Math.round(zoom)}%
                </span>
                {selectedCount > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedCount} asiento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Controles secundarios */}
            <div className="flex items-center gap-2">
              {onSpacingClick && (
                <Tooltip content="Configuración de espaciado">
                  <button
                    onClick={onSpacingClick}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                  </button>
                </Tooltip>
              )}

              {onToggleGrid && (
                <Tooltip content="Mostrar/ocultar cuadrícula">
                  <button
                    onClick={onToggleGrid}
                    className={`p-2 rounded-lg ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                </Tooltip>
              )}

              {onSave && (
                <Tooltip content="Guardar cambios (Ctrl+S)">
                  <button
                    onClick={onSave}
                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Barra de contexto */}
          {tool === 'DRAW' && (
            <Card className="p-2 bg-blue-50 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">Pro Tip:</span>
                <p className="text-gray-600">
                  Dibuja los límites de la sección y guarda para agregar asientos automáticamente
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};