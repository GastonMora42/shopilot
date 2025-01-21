// components/QRDisplay.tsx
import { QRCodeSVG } from "qrcode.react";
import { type ITicket } from '@/app/models/Ticket';
import { Types } from 'mongoose';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

type QRDisplayProps = {
  ticket: {
    _id: Types.ObjectId | string;
    eventType: ITicket['eventType'];
    status: ITicket['status'];
    qrValidation: string;
    qrMetadata: ITicket['qrMetadata'];
    seats?: string[];
    ticketType?: {
      name: string;
      price: number;
    };
    quantity?: number;
  };
};

// components/QRDisplay.tsx
const QRDisplay: React.FC<QRDisplayProps> = ({ ticket }) => {
    const ticketId = typeof ticket._id === 'string' ? ticket._id : ticket._id.toString();
  
    // Si el ticket no está pagado, mostramos un mensaje en lugar del QR
    if (ticket.status !== 'PAID') {
      return (
        <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
          {ticket.status === 'PENDING' ? (
            <>
              <div className="text-amber-500 mb-2">
                <ClockIcon className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium">Pago Pendiente</p>
              <p className="text-sm text-gray-500">El código QR estará disponible una vez confirmado el pago</p>
            </>
          ) : ticket.status === 'USED' ? (
            <>
              <div className="text-gray-400 mb-2">
                <CheckCircleIcon className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium">Ticket Usado</p>
              <p className="text-sm text-gray-500">Este ticket ya ha sido utilizado</p>
            </>
          ) : (
            <>
              <div className="text-red-500 mb-2">
                <XCircleIcon className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium">Ticket Cancelado</p>
              <p className="text-sm text-gray-500">Este ticket no es válido</p>
            </>
          )}
        </div>
      );
    }
  
    // Si el ticket está pagado, mostramos el QR
    const qrData = {
      ticketId,
      eventType: ticket.eventType,
      validation: ticket.qrValidation,
      metadata: ticket.qrMetadata,
      ...(ticket.eventType === 'SEATED' 
        ? { seatInfo: ticket.seats } 
        : { 
            ticketType: ticket.ticketType?.name,
            quantity: ticket.quantity 
          })
    };
  
    return (
      <div className="flex flex-col items-center">
        <QRCodeSVG 
          value={JSON.stringify(qrData)}
          size={200}
          level="H"
          includeMargin={true}
        />
        <p className="mt-2 text-sm text-gray-500">
          Escanea para validar el ticket
        </p>
        <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          Pagado
        </div>
      </div>
    );
  };

export default QRDisplay;