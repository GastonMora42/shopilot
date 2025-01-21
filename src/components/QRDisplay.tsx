// components/QRDisplay.tsx
import { QRCodeSVG } from "qrcode.react";
import { type ITicket } from '@/app/models/Ticket';
import { Types } from 'mongoose';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { QRData } from '@/app/lib/qrGenerator';

interface QRDisplayProps {
  ticket: {
    _id: Types.ObjectId | string;
    eventType: ITicket['eventType'];
    status: ITicket['status'];
    qrCode: string;
    qrValidation: string;
    qrMetadata: ITicket['qrMetadata'];
    seats?: string[];
    ticketType?: {
      name: string;
      price: number;
    };
    quantity?: number;
  };
}

const QRDisplay: React.FC<QRDisplayProps> = ({ ticket }) => {
  // Función para generar los datos del QR
  const generateQRValue = () => {
    const qrData: QRData = {
      ticketId: ticket._id.toString(),
      validationHash: ticket.qrValidation,
      timestamp: ticket.qrMetadata.timestamp,
      type: ticket.eventType,
      metadata: {
        eventType: ticket.eventType,
        ...(ticket.eventType === 'SEATED' 
          ? {
              seatInfo: {
                seats: ticket.seats || []
              }
            }
          : {
              generalInfo: {
                ticketType: ticket.ticketType?.name || '',
                quantity: ticket.quantity || 0
              }
            })
      }
    };

    return JSON.stringify(qrData);
  };

  // Renderizar estados diferentes al pagado
  if (ticket.status !== 'PAID') {
    return (
      <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
        {ticket.status === 'PENDING' ? (
          <>
            <div className="text-amber-500 mb-2">
              <ClockIcon className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">Pago Pendiente</p>
            <p className="text-sm text-gray-500">
              El código QR estará disponible una vez confirmado el pago
            </p>
          </>
        ) : ticket.status === 'USED' ? (
          <>
            <div className="text-gray-400 mb-2">
              <CheckCircleIcon className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">Ticket Usado</p>
            <p className="text-sm text-gray-500">Este ticket ya ha sido utilizado</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(ticket.qrMetadata.timestamp).toLocaleString()}
            </p>
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

  // Renderizar QR para tickets pagados
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QRCodeSVG 
          value={generateQRValue()}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Escanea para validar el ticket
      </p>
      <div className="mt-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
        Ticket Válido
      </div>
      {ticket.eventType === 'SEATED' ? (
        <p className="mt-2 text-sm text-gray-600">
          Asiento{ticket.seats!.length > 1 ? 's' : ''}: {ticket.seats?.join(', ')}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          {ticket.quantity}x {ticket.ticketType?.name}
        </p>
      )}
    </div>
  );
};

export default QRDisplay;