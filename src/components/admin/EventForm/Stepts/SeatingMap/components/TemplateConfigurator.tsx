import { LayoutConfig, LayoutTemplate, TemplateParams } from '@/types/editor';
import React, { Key, useState } from 'react';

interface TemplateConfiguratorProps {
  template: LayoutTemplate;
  onGenerate: (layout: LayoutConfig) => void;
  onBack: () => void;
}
  export const TemplateConfigurator: React.FC<TemplateConfiguratorProps> = ({
    template,
    onGenerate,
    onBack
  }) => {
    const [params, setParams] = useState<TemplateParams>({
        totalRows: 10,
        seatsPerRow: 20,
        aislePositions: [10],
        sectionConfigs: [
          {
            id: 'regular',
            name: 'Regular',
            type: 'REGULAR',
            color: '#3B82F6',
            price: 100,
            rowRange: [3, 9]
          },
          {
            id: 'vip',
            name: 'VIP',
            type: 'VIP',
            color: '#EF4444',
            price: 200,
            rowRange: [0, 2]
          }
        ]
      });
  
    const handleGenerate = () => {
      const layout = template.generateLayout(params);
      onGenerate(layout);
    };
  
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            Configurar {template.name}
          </h3>
        </div>
  
        {/* Configuración básica */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Filas
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={params.totalRows}
              onChange={(e) => setParams((prev: any) => ({
                ...prev,
                totalRows: Number(e.target.value)
              }))}
              className="w-full p-2 border rounded-md"
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asientos por Fila
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={params.seatsPerRow}
              onChange={(e) => setParams((prev: any) => ({
                ...prev,
                seatsPerRow: Number(e.target.value)
              }))}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
  
        {/* Configuración de secciones */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Secciones</h4>
          {params.sectionConfigs.map((section: { id: Key | null | undefined; }, index: any) => (
            <div key={section.id} className="border rounded-lg p-4">
              {/* ... Campos de configuración de sección ... */}
            </div>
          ))}
        </div>
  
        <div className="flex justify-end space-x-4">
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generar Layout
          </button>
        </div>
      </div>
    );
  };