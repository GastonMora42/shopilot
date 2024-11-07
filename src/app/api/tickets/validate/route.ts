// app/api/tickets/validate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { qrCode } = await req.json();

    // Validar entrada
    if (!qrCode) {
      return NextResponse.json(
        { error: 'Código QR requerido' },
        { status: 400 }
      );
    }

    // Buscar el ticket
    const ticket = await Ticket.findOne({ qrCode }).populate('eventId');
    
    if (!ticket) {
      return NextResponse.json({
        success: false,
        message: 'Ticket no encontrado',
        code: 'TICKET_NOT_FOUND'
      }, { status: 404 });
    }

    // Verificar estado del ticket
    switch (ticket.status) {
      case 'PENDING':
        return NextResponse.json({
          success: false,
          message: 'Ticket no pagado',
          code: 'TICKET_UNPAID'
        }, { status: 400 });

      case 'USED':
        return NextResponse.json({
          success: false,
          message: 'Ticket ya utilizado',
          code: 'TICKET_USED',
          ticket: {
            eventName: ticket.eventId.name,
            buyerName: ticket.buyerInfo.name,
            seatNumber: ticket.seats.join(', '),
            usedAt: ticket.updatedAt
          }
        }, { status: 400 });

        case 'PAID':
          // Marcar ticket como usado
          ticket.status = 'USED';
          ticket.usedAt = new Date();
          await ticket.save();
  
          return NextResponse.json({
            success: true,
            message: '¡ACCESO PERMITIDO!', // Cambiar mensaje para que coincida
            ticket: {
              eventName: ticket.eventId.name,
              buyerName: ticket.buyerInfo.name,
              seatNumber: ticket.seats.join(', '),
              status: 'USED'
            }
          });

      default:
        return NextResponse.json({
          success: false,
          message: 'Estado de ticket inválido',
          code: 'INVALID_STATUS'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error validando ticket:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al validar ticket',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}