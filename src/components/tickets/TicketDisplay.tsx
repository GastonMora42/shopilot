// components/tickets/TicketDisplay.tsx
import React from 'react';
import { 
  Event, 
  Seat, 
  SelectedGeneralTicket, 
  GeneralTicket 
} from '@/types/event';

interface TicketDisplayProps {
  event: Event;
  seats?: Seat[];
  selectedSeats: Seat[];
  selectedTickets: SelectedGeneralTicket[];
  onSeatSelect: (seat: Seat) => void;
  onTicketSelect: (ticketId: string, quantity: number) => void;
  maxTicketsPerPurchase?: number;
  isLoading?: boolean;
}

export const TicketDisplay: React.FC<TicketDisplayProps> = ({
  event,
  seats = [],
  selectedSeats,
  selectedTickets,
  onSeatSelect,
  onTicketSelect,
  maxTicketsPerPurchase = 10,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se encontró información del evento</p>
      </div>
    );
  }

  // Componente para tickets generales
  const GeneralTicketsDisplay = () => {
    if (!event.generalTickets) return null;

    const getTotalSelectedTickets = (): number => {
      return selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    };

    const getTicketQuantity = (ticketId: string): number => {
      const selected = selectedTickets.find(t => t.ticketId === ticketId);
      return selected?.quantity ?? 0;
    };

    return (
      <div className="space-y-4">
        {event.generalTickets.map((ticket: GeneralTicket) => {
          const currentQuantity = getTicketQuantity(ticket.id);
          const availableQuantity = ticket.quantity;
          const totalSelectedTickets = getTotalSelectedTickets();

          return (
            <div 
              key={ticket.id}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{ticket.name}</h3>
                  {ticket.description && (
                    <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                  )}
                  <p className="text-lg font-medium mt-2">
                    ${ticket.price.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onTicketSelect(ticket.id, Math.max(0, currentQuantity - 1))}
                    disabled={currentQuantity === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full border
                             hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  
                  <span className="w-8 text-center font-medium">
                    {currentQuantity}
                  </span>
                  
                  <button
                    onClick={() => {
                      if (currentQuantity < availableQuantity && 
                          totalSelectedTickets < maxTicketsPerPurchase) {
                        onTicketSelect(ticket.id, currentQuantity + 1);
                      }
                    }}
                    disabled={
                      currentQuantity >= availableQuantity ||
                      totalSelectedTickets >= maxTicketsPerPurchase
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full border
                             hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {currentQuantity > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  Subtotal: ${(ticket.price * currentQuantity).toFixed(2)}
                </div>
              )}
            </div>
          );
        })}

        {selectedTickets.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Resumen de selección</h4>
            <div className="mt-2 space-y-2">
              {selectedTickets.map(ticket => {
                const ticketInfo = event.generalTickets?.find(t => t.id === ticket.ticketId);
                if (!ticketInfo) return null;

                return (
                  <div key={ticket.ticketId} className="flex justify-between text-sm">
                    <span>{ticketInfo.name} × {ticket.quantity}</span>
                    <span>${(ticketInfo.price * ticket.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                <span>Total</span>
                <span>
                  ${selectedTickets.reduce((sum, ticket) => {
                    const ticketInfo = event.generalTickets?.find(t => t.id === ticket.ticketId);
                    return sum + (ticketInfo?.price || 0) * ticket.quantity;
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente para eventos con asientos
  const SeatedEventDisplay = () => {
    if (!seats.length) return null;

    const getSeatColor = (seat: Seat) => {
      if (selectedSeats.some(s => s._id === seat._id)) {
        return 'rgb(59, 130, 246)'; // blue-500
      }
      switch (seat.status) {
        case 'OCCUPIED':
          return 'rgb(239, 68, 68)'; // red-500
        case 'RESERVED':
          return 'rgb(234, 179, 8)'; // yellow-500
        default:
          switch (seat.type) {
            case 'VIP':
              return 'rgb(147, 51, 234)'; // purple-600
            case 'DISABLED':
              return 'rgb(107, 114, 128)'; // gray-500
            default:
              return 'rgb(255, 255, 255)'; // white
          }
      }
    };

    const maxRow = Math.max(...seats.map(s => s.row));
    const maxCol = Math.max(...seats.map(s => s.column));
    const seatSize = 30;
    const padding = 40;
    const viewBox = `0 0 ${(maxCol * seatSize) + (padding * 2)} ${(maxRow * seatSize) + (padding * 2)}`;

    return (
      <div className="space-y-6">
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white border rounded" />
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm">Seleccionado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm">Ocupado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-sm">Reservado</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-600 rounded" />
            <span className="text-sm">VIP</span>
          </div>
        </div>

        {/* Mapa de asientos */}
        <div className="relative w-full overflow-auto bg-gray-100 rounded-lg">
          <svg
            viewBox={viewBox}
            className="w-full"
            style={{ minHeight: '400px' }}
          >
            {/* Escenario */}
            <rect
              x={padding}
              y={10}
              width={(maxCol * seatSize)}
              height={20}
              rx={5}
              className="fill-gray-300"
            />
            <text
              x={padding + ((maxCol * seatSize) / 2)}
              y={25}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              ESCENARIO
            </text>

            {/* Asientos */}
            {seats.map((seat) => {
              const x = padding + ((seat.column - 1) * seatSize);
              const y = padding + ((seat.row - 1) * seatSize);
              const isAvailable = seat.status === 'AVAILABLE';
              const isSelected = selectedSeats.some(s => s._id === seat._id);

              return (
                <g key={seat._id}>
                  <rect
                    x={x}
                    y={y}
                    width={25}
                    height={25}
                    rx={4}
                    fill={getSeatColor(seat)}
                    className={`
                      stroke-gray-300 transition-all duration-200
                      ${isAvailable ? 'cursor-pointer hover:stroke-blue-500' : ''}
                      ${!isAvailable ? 'cursor-not-allowed' : ''}
                      ${isSelected ? 'scale-110' : ''}
                    `}
                    onClick={() => {
                      if (isAvailable && 
                          (isSelected || selectedSeats.length < maxTicketsPerPurchase)) {
                        onSeatSelect(seat);
                      }
                    }}
                  />
                  <text
                    x={x + 12.5}
                    y={y + 16}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-700 pointer-events-none"
                  >
                    {seat.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Resumen de asientos seleccionados */}
        {selectedSeats.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Asientos seleccionados</h4>
            <div className="mt-2 space-y-2">
              {Object.entries(
                selectedSeats.reduce((acc, seat) => {
                  const key = `${seat.section}-${seat.price}`;
                  if (!acc[key]) {
                    acc[key] = {
                      section: seat.section,
                      price: seat.price,
                      seats: []
                    };
                  }
                  acc[key].seats.push(seat);
                  return acc;
                }, {} as Record<string, { section: string; price: number; seats: Seat[] }>)
              ).map(([key, { section, price, seats }]) => (
                <div key={key}>
                  <div className="text-sm font-medium">
                    {section} - ${price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Asientos: {seats.map(s => s.label).join(', ')}
                  </div>
                  <div className="text-sm">
                    Subtotal: ${(price * seats.length).toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                <span>Total</span>
                <span>
                  ${selectedSeats.reduce((sum, seat) => sum + seat.price, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {event.eventType === 'SEATED' ? <SeatedEventDisplay /> : <GeneralTicketsDisplay />}
    </div>
  );
};

export default TicketDisplay;