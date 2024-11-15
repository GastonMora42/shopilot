// components/events/SeatingStep.tsx
import { useState, useCallback } from "react";
import { Button } from "../ui/Button";
import { cn } from "@/app/lib/utils";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";

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

const ZoomControls = () => {
  const [scale, setScale] = useState(1);
  
  return (
    <div className="flex gap-2 mb-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setScale(1)}
      >
        <RotateCcwIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <span className="text-sm text-gray-500">
        {Math.round(scale * 100)}%
      </span>
    </div>
  );
};

export function SeatingStep({ data, onChange }: SeatingStepProps) {
  const [showPreview, setShowPreview] = useState(true);

  const generateSeatId = useCallback((rowIndex: number, colIndex: number): string => {
    return `${rowIndex + 1}-${colIndex + 1}`;
  }, []);

  const generateDisplayId = useCallback((rowIndex: number, colIndex: number): string => {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    const colNumber = colIndex + 1;
    return `${rowLetter}${colNumber}`;
  }, []);

  const handleDimensionChange = useCallback((field: 'rows' | 'columns', value: number) => {
    onChange({
      ...data,
      [field]: value,
      sections: data.sections.map(section => ({
        ...section,
        rowEnd: field === 'rows' ? Math.min(section.rowEnd, value) : section.rowEnd,
        columnEnd: field === 'columns' ? Math.min(section.columnEnd, value) : section.columnEnd
      }))
    });
  }, [data, onChange]);

  const getSectionInfo = useCallback((rowIndex: number, colIndex: number) => {
    const section = data.sections.find(s => 
      rowIndex + 1 >= s.rowStart &&
      rowIndex + 1 <= s.rowEnd &&
      colIndex + 1 >= s.columnStart &&
      colIndex + 1 <= s.columnEnd
    );

    if (section) {
      return {
        sectionName: section.name,
        sectionType: section.type,
        sectionPrice: section.price,
        seatId: generateSeatId(rowIndex, colIndex),
        displayId: generateDisplayId(rowIndex, colIndex)
      };
    }
    return null;
  }, [data.sections, generateSeatId, generateDisplayId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Número de Filas (A-Z)
          </label>
          <input
            type="number"
            min="1"
            max="26"
            className="w-full p-2 border rounded"
            value={data.rows}
            onChange={e => handleDimensionChange('rows', parseInt(e.target.value) || 1)}
          />
          <p className="text-xs text-gray-500 mt-1">Máximo 26 filas (A-Z)</p>
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
            onChange={e => handleDimensionChange('columns', parseInt(e.target.value) || 1)}
          />
          <p className="text-xs text-gray-500 mt-1">Máximo 50 columnas</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Vista Previa del Mapa</h3>
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
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={2}
              limitToBounds={false}
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="flex gap-2 mb-4 sticky top-0 z-20 bg-gray-50">
                    <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => resetTransform()}>
                      <RotateCcwIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <TransformComponent
                    wrapperClass="!w-full !overflow-visible"
                    contentClass="!w-full"
                  >
                    <div className="min-w-max">
                      {/* Header con números de columna */}
                      <div className="flex mb-2 sticky top-0 bg-gray-50 z-10">
                        <div className="w-12 flex-shrink-0"></div>
                        {Array.from({ length: data.columns }).map((_, colIndex) => (
                          <div 
                            key={colIndex} 
                            className="w-10 flex-shrink-0 text-center text-xs text-gray-500"
                          >
                            {colIndex + 1}
                          </div>
                        ))}
                      </div>

                      {/* Grilla de asientos */}
                      <div className="grid gap-1">
                        {Array.from({ length: data.rows }).map((_, rowIndex) => (
                          <div key={rowIndex} className="flex items-center">
                            <div className="w-12 flex-shrink-0 text-center text-xs font-medium text-gray-600">
                              {String.fromCharCode(65 + rowIndex)}
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: data.columns }).map((_, colIndex) => {
                                const sectionInfo = getSectionInfo(rowIndex, colIndex);
                                return (
                                  <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={cn(
                                      "w-10 h-10 rounded-sm border flex items-center justify-center",
                                      "text-xs font-medium relative group flex-shrink-0",
                                      getSeatColor(sectionInfo?.sectionType),
                                      "transition-all duration-200 hover:scale-110"
                                    )}
                                  >
                                    {sectionInfo?.displayId}
                                    <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 text-white text-xs rounded whitespace-nowrap z-20">
                                      {sectionInfo ? (
                                        <>
                                          {[
                                            ['ID', sectionInfo.seatId],
                                            ['Display', sectionInfo.displayId],
                                            ['Sección', sectionInfo.sectionName],
                                            ['Precio', `$${sectionInfo.sectionPrice}`]
                                          ].map(([label, value], index) => (
                                            <div key={index}>
                                              {label}: {value}
                                            </div>
                                          ))}
                                        </>
                                      ) : (
                                        'No asignado'
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
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
        <p>Tips:</p>
        <ul className="list-disc pl-5 space-y-1">
          {[
            'Configura el tamaño del mapa antes de definir las secciones',
            'Los IDs de asientos se generarán en formato fila-columna (ej: 1-1)',
            'Los asientos se mostrarán con letras y números (ej: A1)',
            'Las secciones definen el tipo y precio de cada asiento',
            'Usa el zoom para ver mejor los detalles del mapa'
          ].map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getSeatColor(type?: 'REGULAR' | 'VIP' | 'DISABLED'): string {
  switch (type) {
    case 'VIP':
      return 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100';
    case 'DISABLED':
      return 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100';
    case 'REGULAR':
      return 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-500';
  }
}