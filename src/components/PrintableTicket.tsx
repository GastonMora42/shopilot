// components/PrintableTicket.tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { type ITicket } from '@/app/models/Ticket';
import type { Event } from '@/app/models/Event';
import { Types } from "mongoose";
import QRDisplay from "./QRDisplay";

interface PrintableTicketProps {
    ticket: Omit<ITicket, '_id'> & {
      _id: Types.ObjectId | string;
      eventId: {
        name: string;
        date: string;
        location: string;
      };
    };
  }
  
  const PrintableTicket: React.FC<PrintableTicketProps> = ({ ticket }) => {
    return (
      <div className="print-ticket" style={{ pageBreakAfter: 'always' }}>
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
              <span className="font-semibold">Asientos:</span>{' '}
              {ticket.seats?.join(', ')}
            </p>
          ) : (
            <>
              <p className="text-gray-700">
                <span className="font-semibold">Tipo:</span>{' '}
                {ticket.ticketType?.name}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Cantidad:</span>{' '}
                {ticket.quantity}
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

        {ticket.status === 'PAID' && (
          <div className="qr-container mt-6 text-center">
  {/* QR Display */}
  <div className="mt-6 flex justify-center">
          <QRDisplay 
            ticket={{
              _id: ticket._id,
              eventType: ticket.eventType,
              status: ticket.status,
              qrValidation: ticket.qrValidation,
              qrMetadata: ticket.qrMetadata,
              seats: ticket.seats,
              ticketType: ticket.ticketType,
              quantity: ticket.quantity
            }} 
          />
        </div>

            <p className="mt-2 text-sm text-gray-500">
              Muestra este código QR en la entrada
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            ID del ticket: {ticket._id.toString()}
          </p>
          <p className="font-semibold mt-2">
            Total: ${ticket.price}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableTicket;