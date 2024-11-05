import { useState } from "react";
import { Button } from "../ui/Button";
  
  // components/SeatingStep.tsx
  interface SeatingStepProps {
    data: {
      rows: number;
      columns: number;
      sections: Array<{
        name: string;
        type: 'REGULAR' | 'VIP' | 'DISABLED';
        price: number;
        rowStart: number;
        rowEnd: number;
        columnStart: number;
        columnEnd: number;
      }>;
    };
    onChange: (data: any) => void;
  }
  
  export function SeatingStep({ data, onChange }: SeatingStepProps) {
    const [showPreview, setShowPreview] = useState(true);
  
    const handleDimensionChange = (field: 'rows' | 'columns', value: number) => {
      onChange({
        ...data,
        [field]: value,
        // Ajustar secciones si las dimensiones cambian
        sections: data.sections.map(section => ({
          ...section,
          rowEnd: field === 'rows' ? Math.min(section.rowEnd, value - 1) : section.rowEnd,
          columnEnd: field === 'columns' ? Math.min(section.columnEnd, value - 1) : section.columnEnd
        }))
      });
    };
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Número de Filas
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full p-2 border rounded"
              value={data.rows}
              onChange={e => handleDimensionChange('rows', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Número de Columnas
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="w-full p-2 border rounded"
              value={data.columns}
              onChange={e => handleDimensionChange('columns', parseInt(e.target.value))}
            />
          </div>
        </div>
  
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Vista Previa</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
            </Button>
          </div>
  
          {showPreview && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid gap-1" style={{
                gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))`
              }}>
                {Array.from({ length: data.rows }).map((_, rowIndex) =>
                  Array.from({ length: data.columns }).map((_, colIndex) => {
                    const section = data.sections.find(
                      s => 
                        rowIndex >= s.rowStart &&
                        rowIndex <= s.rowEnd &&
                        colIndex >= s.columnStart &&
                        colIndex <= s.columnEnd
                    );
  
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          w-6 h-6 rounded-sm border
                          ${getSeatColor(section?.type)}
                        `}
                        title={section ? `${section.name} - $${section.price}` : 'No asignado'}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
  
        <div className="text-sm text-gray-500">
          Tip: Configura el tamaño del mapa de asientos antes de definir las secciones en el siguiente paso.
        </div>
      </div>
    );
  }
  
  function getSeatColor(type?: 'REGULAR' | 'VIP' | 'DISABLED'): string {
    switch (type) {
      case 'VIP':
        return 'bg-purple-200';
      case 'DISABLED':
        return 'bg-blue-200';
      case 'REGULAR':
        return 'bg-green-200';
      default:
        return 'bg-gray-200';
    }
  }