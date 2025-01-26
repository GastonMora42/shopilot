// components/PrintableTicket.tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Types } from "mongoose";
import QRDisplay, { QRTicket } from "./QRDisplay";

interface PrintableTicketProps {
  ticket: {
    _id: Types.ObjectId | string;
    eventId: {
      name: string;
      date: string;
      location: string;
    };
    eventType: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seats?: string[];
    ticketType?: {
      name: string;
      price: number;
    };
    quantity?: number;
    price: number;
    buyerInfo: {
      name: string;
      email: string;
      dni: string;
      phone?: string;
    };
    qrTickets: QRTicket[];
  }
}

const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket }) => {
  return (
    <div className="space-y-8">
      {ticket.qrTickets.map((qrTicket, index) => (
        <div key={qrTicket.subTicketId} className="print-ticket" style={{ pageBreakAfter: 'always' }}>
          <div className="ticket-container border rounded-lg p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{ticket.eventId.name}</h1>
            
            <div className="ticket-details space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Fecha:</span>{' '}
                {format(new Date(ticket.eventId.date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Ubicación:</span>{' '}
                {ticket.eventId.location}
              </p>

              {ticket.eventType === 'SEATED' ? (
                <p className="text-gray-700">
                  <span className="font-semibold">Asiento:</span>{' '}
                  {qrTicket.seatInfo?.seat}
                </p>
              ) : (
                <>
                  <p className="text-gray-700">
                    <span className="font-semibold">Tipo:</span>{' '}
                    {ticket.ticketType?.name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Entrada:</span>{' '}
                    {index + 1} de {ticket.quantity}
                  </p>
                </>
              )}

              <div className="border-t pt-2 mt-4">
                <p className="text-gray-700">
                  <span className="font-semibold">Comprador:</span>{' '}
                  {ticket.buyerInfo.name}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">DNI:</span>{' '}
                  {ticket.buyerInfo.dni}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{' '}
                  {ticket.buyerInfo.email}
                </p>
                {ticket.buyerInfo.phone && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Teléfono:</span>{' '}
                    {ticket.buyerInfo.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="qr-container mt-6 text-center">
              <div className="mt-6 flex justify-center">
                <QRDisplay 
                  qrTicket={qrTicket}
                  eventType={ticket.eventType}
                  ticketQuantity={ticket.quantity}
                />
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Muestra este código QR en la entrada
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                ID del ticket: {qrTicket.subTicketId.slice(-8)}
              </p>
              <p className="font-semibold mt-2">
                Total: ${ticket.eventType === 'SEATED' 
                  ? (ticket.price / ticket.seats!.length).toFixed(2)
                  : ticket.ticketType!.price.toFixed(2)
                }
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PrintableTicket;