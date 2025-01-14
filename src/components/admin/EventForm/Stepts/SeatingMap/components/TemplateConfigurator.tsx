// components/events/SeatMapConfigurator.tsx
import React, { useState } from 'react';
import { Seat } from '@/types';
import { SeatMap } from '@/components/events/SeatMap';

interface Section {
  id: string;
  name: string;
  type: 'REGULAR' | 'VIP' | 'DISABLED';
  price: number;
  color: string;
}

interface SeatMapConfiguratorProps {
  onGenerate: (config: { seats: Seat[], sections: Section[] }) => void;
  onBack: () => void;
}

export const SeatMapConfigurator: React.FC<SeatMapConfiguratorProps> = ({
  onGenerate,
  onBack
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      name: 'Regular',
      type: 'REGULAR',
      price: 1000,
      color: '#3B82F6'
    }
  ]);
  const [selectedSection, setSelectedSection] = useState(sections[0].id);

  const handleSeatCreate = (seatData: Partial<Seat>) => {
    const newSeat = {
      _id: Date.now().toString(),
      ...seatData
    } as Seat;
    setSeats(prev => [...prev, newSeat]);
  };

  const handleSeatDelete = (seatId: string) => {
    setSeats(prev => prev.filter(s => s._id !== seatId));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Volver
        </button>
        <h3 className="text-lg font-medium">Configurar Mapa de Asientos</h3>
      </div>

      {/* Secciones */}
      <div className="space-y-4">
        <h4 className="font-medium">Secciones</h4>
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`px-4 py-2 rounded-lg ${
                selectedSection === section.id ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{ backgroundColor: section.color, color: 'white' }}
            >
              {section.name}
            </button>
          ))}
          <button
            onClick={() => {
              const newSection: Section = {
                id: Date.now().toString(),
                name: `Sección ${sections.length + 1}`,
                type: 'REGULAR',
                price: 1000,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`
              };
              setSections(prev => [...prev, newSection]);
            }}
            className="px-4 py-2 border-2 border-dashed rounded-lg hover:border-gray-400"
          >
            + Agregar Sección
          </button>
        </div>

        {/* Editor de sección seleccionada */}
        {sections.map(section => section.id === selectedSection && (
          <div key={section.id} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <input
                type="text"
                value={section.name}
                onChange={e => {
                  setSections(prev => prev.map(s =>
                    s.id === section.id ? { ...s, name: e.target.value } : s
                  ));
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={section.type}
                onChange={e => {
                  setSections(prev => prev.map(s =>
                    s.id === section.id ? { ...s, type: e.target.value as 'REGULAR' | 'VIP' | 'DISABLED' } : s
                  ));
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="REGULAR">Regular</option>
                <option value="VIP">VIP</option>
                <option value="DISABLED">Discapacitados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="number"
                value={section.price}
                onChange={e => {
                  setSections(prev => prev.map(s =>
                    s.id === section.id ? { ...s, price: Number(e.target.value) } : s
                  ));
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="color"
                value={section.color}
                onChange={e => {
                  setSections(prev => prev.map(s =>
                    s.id === section.id ? { ...s, color: e.target.value } : s
                  ));
                }}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mapa de Asientos */}
      <div className="border rounded-lg p-4">
        <SeatMap
          mode="edit"
          seats={seats}
          selectedSeats={[]}
          onSeatClick={() => {}}
          onSeatCreate={handleSeatCreate}
          onSeatDelete={handleSeatDelete}
          sections={sections}
          selectedSection={selectedSection}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => onGenerate({ seats, sections })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={seats.length === 0}
        >
          Generar Mapa
        </button>
      </div>
    </div>
  );
};