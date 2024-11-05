// app/(public)/tickets/success/page.tsx
import { redirect } from 'next/navigation';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export default async function SuccessPage({
  searchParams
}: {
  searchParams: { ticketId: string }
}) {
  const { ticketId } = searchParams;

  if (!ticketId) {
    redirect('/');
  }

  await dbConnect();
  const ticket = await Ticket.findById(ticketId).populate('eventId');

  if (!ticket) {
    redirect('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            ¡Compra exitosa!
          </h1>
          <p className="mb-6">
            Tu entrada ha sido confirmada. Hemos enviado los detalles a tu email.
          </p>

          <div className="mt-8">
            <img
              src={ticket.qrCode}
              alt="Código QR de entrada"
              className="mx-auto"
            />
            <p className="text-sm text-gray-500 mt-2">
              Presenta este código QR en el evento
            </p>
          </div>

          <div className="mt-8 text-left">
            <h2 className="font-semibold mb-2">Detalles de la compra:</h2>
            <div className="space-y-2 text-sm">
              <p>Evento: {ticket.eventId.name}</p>
              <p>Comprador: {ticket.buyerInfo.name}</p>
              <p>Email: {ticket.buyerInfo.email}</p>
              <p>DNI: {ticket.buyerInfo.dni}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}