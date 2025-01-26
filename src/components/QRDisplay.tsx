// components/QRDisplay.tsx
import { QRCodeSVG } from "qrcode.react";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

export interface QRTicket {
  subTicketId: string;
  qrCode: string;
  qrValidation: string;
  qrMetadata: {
    timestamp: number;
    ticketId: string;
    subTicketId: string;
    type: 'SEATED' | 'GENERAL';
    status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
    seatInfo?: {
      seat: string;
    };
    generalInfo?: {
      ticketType: string;
      index: number;
    };
  };
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface QRDisplayProps {
  qrTicket: QRTicket;
  eventType: 'SEATED' | 'GENERAL';
  ticketQuantity?: number;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ qrTicket, eventType, ticketQuantity }) => {
  // Renderizar estados diferentes al pagado
  if (qrTicket.status !== 'PAID') {
    return (
      <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
        {qrTicket.status === 'PENDING' ? (
          <>
            <div className="text-amber-500 mb-2">
              <ClockIcon className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">Pago Pendiente</p>
            <p className="text-sm text-gray-500">
              El código QR estará disponible una vez confirmado el pago
            </p>
          </>
        ) : qrTicket.status === 'USED' ? (
          <>
            <div className="text-gray-400 mb-2">
              <CheckCircleIcon className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium">Ticket Usado</p>
            <p className="text-sm text-gray-500">Este ticket ya ha sido utilizado</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(qrTicket.qrMetadata.timestamp).toLocaleString()}
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
          value={qrTicket.qrCode}
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
      {eventType === 'SEATED' ? (
        <p className="mt-2 text-sm text-gray-600">
          Asiento: {qrTicket.seatInfo?.seat}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          Entrada {(qrTicket.generalInfo?.index || 0) + 1} de {ticketQuantity}
        </p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        ID: {qrTicket.subTicketId.slice(-8)}
      </p>
    </div>
  );
};

export default QRDisplay;