// components/events/PricingStep.tsx
interface PricingStepProps {
    sections: Array<{
      name: string;
      type: 'REGULAR' | 'VIP' | 'DISABLED';
      price: number;
      rowStart: number;
      rowEnd: number;
      columnStart: number;
      columnEnd: number;
    }>;
    onChange: (sections: any) => void;
  }
  
  export function PricingStep({ sections, onChange }: PricingStepProps) {
    const handleSectionChange = (index: number, field: string, value: any) => {
      const newSections = sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      );
      onChange(newSections);
    };
  
    return (
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de la Sección
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={section.name}
                  onChange={e => handleSectionChange(index, 'name', e.target.value)}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={section.type}
                  onChange={e => handleSectionChange(index, 'type', e.target.value)}
                >
                  <option value="REGULAR">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="DISABLED">Discapacitados</option>
                </select>
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded"
                  value={section.price}
                  onChange={e => handleSectionChange(index, 'price', Number(e.target.value))}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rango de Filas
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={section.rowStart}
                    onChange={e => handleSectionChange(index, 'rowStart', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={section.rowEnd}
                    onChange={e => handleSectionChange(index, 'rowEnd', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  