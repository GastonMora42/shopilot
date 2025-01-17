
// components/admin/EventForm/steps/GeneralTicketsStep.tsx
import React from 'react';

interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface GeneralTicketsStepProps {
  tickets: TicketType[];
  onChange: (tickets: TicketType[]) => void;
}

export const GeneralTicketsStep: React.FC<GeneralTicketsStepProps> = ({
  tickets,
  onChange,
}) => {
  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      quantity: 0,
    };
    onChange([...tickets, newTicket]);
  };

  const updateTicket = (index: number, updates: Partial<TicketType>) => {
    const updatedTickets = tickets.map((ticket, i) =>
      i === index ? { ...ticket, ...updates } : ticket
    );
    onChange(updatedTickets);
  };

  const removeTicket = (index: number) => {
    onChange(tickets.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tipos de Entrada</h3>
        <button
          type="button"
          onClick={addTicketType}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar Tipo
        </button>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket, index) => (
          <div key={ticket.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between">
              <h4 className="font-medium">Tipo de Entrada {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeTicket(index)}
                className="text-red-600 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-md"
                  value={ticket.name}
                  onChange={(e) => updateTicket(index, { name: e.target.value })}
                  placeholder="ej: General, VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                  value={ticket.price}
                  onChange={(e) =>
                    updateTicket(index, { price: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Disponible
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full p-2 border rounded-md"
                  value={ticket.quantity}
                  onChange={(e) =>
                    updateTicket(index, { quantity: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={ticket.description || ''}
                  onChange={(e) =>
                    updateTicket(index, { description: e.target.value })
                  }
                  placeholder="ej: Incluye meet & greet"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};