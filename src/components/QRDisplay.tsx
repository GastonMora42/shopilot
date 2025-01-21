// components/QRDisplay.tsx
import { QRCodeSVG } from "qrcode.react";
import { type ITicket } from '@/app/models/Ticket';
import { Types } from 'mongoose';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

type QRDisplayProps = {
  ticket: {
    qrCode: string | string[];
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
  
    return (
      <div className="flex flex-col items-center">
        <QRCodeSVG 
          value={ticket.qrCode} // Usar directamente el QR almacenado
          size={200}
          level="H"
          includeMargin={true}
        />
        <p className="mt-2 text-sm text-gray-500">
          Escanea para validar el ticket
        </p>
      </div>
    );
  };

export default QRDisplay;