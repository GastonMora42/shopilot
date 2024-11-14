import { useState } from "react";
import { Button } from "../ui/Button";
import { cn } from "@/app/lib/utils";

interface SeatingStepData {
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
}

interface SeatingStepProps {
  data: SeatingStepData;
  onChange: (data: SeatingStepData) => void;
}

const generateSeatId = (rowIndex: number, colIndex: number): string => {
  const rowLetter = String.fromCharCode(65 + rowIndex); // Convierte 0->A, 1->B, etc.
  const colNumber = colIndex + 0; // Los números de columna empiezan en 1
  return `${rowLetter}${colNumber}`;
};

export function SeatingStep({ data, onChange }: SeatingStepProps) {
  const [showPreview, setShowPreview] = useState(true);

  const handleDimensionChange = (field: 'rows' | 'columns', value: number) => {
    onChange({
      ...data,
      [field]: value,
      sections: data.sections.map(section => ({
        ...section,
        rowEnd: field === 'rows' ? Math.min(section.rowEnd, value - 1) : section.rowEnd,
        columnEnd: field === 'columns' ? Math.min(section.columnEnd, value - 1) : section.columnEnd
      }))
    });
  };

  const getSectionInfo = (rowIndex: number, colIndex: number) => {
    const section = data.sections.find(s => 
      rowIndex >= s.rowStart &&
      rowIndex <= s.rowEnd &&
      colIndex >= s.columnStart &&
      colIndex <= s.columnEnd
    );

    if (section) {
      return {
        sectionName: section.name,
        sectionType: section.type,
        sectionPrice: section.price,
        seatId: generateSeatId(rowIndex, colIndex)
      };
    }
    return null;
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
            max="26" // Limitado a letras del alfabeto
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
          <div className="bg-gray-50 p-4 rounded-lg overflow-auto">
            <div className="flex mb-2">
              <div className="w-10"></div>
              {Array.from({ length: data.columns }).map((_, colIndex) => (
                <div key={colIndex} className="w-8 text-center text-xs text-gray-500">
                  {colIndex + 1}
                </div>
              ))}
            </div>
            <div className="grid gap-1">
              {Array.from({ length: data.rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center">
                  <div className="w-10 text-center text-xs font-medium text-gray-600">
                    {String.fromCharCode(65 + rowIndex)}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: data.columns }).map((_, colIndex) => {
                      const sectionInfo = getSectionInfo(rowIndex, colIndex);
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={cn(
                            "w-8 h-8 rounded-sm border flex items-center justify-center",
                            "text-xs font-medium",
                            getSeatColor(sectionInfo?.sectionType),
                            "transition-all duration-200 hover:scale-110"
                          )}
                          title={sectionInfo ? 
                            `${sectionInfo.seatId} - ${sectionInfo.sectionName} - $${sectionInfo.sectionPrice}` 
                            : 'No asignado'}
                        >
                          {sectionInfo?.seatId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Leyenda:</div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm border ${getSeatColor('REGULAR')}`} />
            <span className="text-sm">Regular</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm border ${getSeatColor('VIP')}`} />
            <span className="text-sm">VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm border ${getSeatColor('DISABLED')}`} />
            <span className="text-sm">Discapacitados</span>
          </div>
        </div>
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
      return 'bg-purple-200 hover:bg-purple-300';
    case 'DISABLED':
      return 'bg-blue-200 hover:bg-blue-300';
    case 'REGULAR':
      return 'bg-green-200 hover:bg-green-300';
    default:
      return 'bg-gray-200';
  }
}