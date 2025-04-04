// src/app/api/tickets/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// Función para crear PDF
async function generateTicketPDF(ticket: any, event: any) {
  // Crear un nuevo documento PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configurar fuentes
  doc.setFont("helvetica");
  
  // Título
  doc.setFontSize(20);
  doc.text(event.name, 105, 20, { align: 'center' });
  
  // Información del evento
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date(event.date).toLocaleDateString('es-ES')}`, 20, 40);
  doc.text(`Hora: ${new Date(event.date).toLocaleTimeString('es-ES')}`, 20, 47);
  doc.text(`Ubicación: ${event.location}`, 20, 54);
  
  // Información del comprador
  doc.text(`Comprador: ${ticket.buyerInfo.name}`, 20, 65);
  doc.text(`Email: ${ticket.buyerInfo.email}`, 20, 72);
  doc.text(`DNI: ${ticket.buyerInfo.dni}`, 20, 79);
  
  // Detalles de la compra
  doc.text(`Estado: ${ticket.status === 'PAID' ? 'Pagado' : ticket.status}`, 20, 90);
  doc.text(`Precio Total: $${ticket.price}`, 20, 97);
  
  let yPos = 110;
  
  // Generar QRs para tickets pagados
  if (ticket.qrTickets && ticket.qrTickets.length > 0) {
    for (const qrTicket of ticket.qrTickets) {
      if (qrTicket.qrMetadata.status !== 'PAID') continue;
      
      // Nueva página si no hay suficiente espacio
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      // Información del ticket
      if (ticket.eventType === 'SEATED') {
        doc.text(`Asiento: ${qrTicket.qrMetadata.seatInfo?.seat}`, 105, yPos, { align: 'center' });
      } else {
        doc.text(`Entrada ${(qrTicket.qrMetadata.generalInfo?.index ?? 0) + 1} de ${ticket.quantity}`, 105, yPos, { align: 'center' });
        doc.text(`Tipo: ${qrTicket.qrMetadata.generalInfo?.ticketType}`, 105, yPos + 7, { align: 'center' });
      }
      yPos += 15;
      
      // Generar QR
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qrTicket.qrCode, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300
        });
        
        // Insertar QR en PDF
        doc.addImage(qrCodeDataURL, 'PNG', 70, yPos, 70, 70);
        yPos += 75;
        
        // ID del ticket
        doc.setFontSize(10);
        doc.text(`ID: ${qrTicket.qrMetadata.subTicketId.slice(-8)}`, 105, yPos, { align: 'center' });
        yPos += 20;
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    }
  }
  
  return doc.output('arraybuffer');
}

// Exportar función POST para el endpoint
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();
    
    // Obtener ID del ticket del cuerpo de la solicitud
    const { ticketId } = await request.json();
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Buscar el ticket en la base de datos
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Verificar que el ticket pertenece al usuario actual
    if (ticket.userId.toString() !== session.user.id && 
        ticket.buyerInfo.email !== session.user.email) {
      return NextResponse.json(
        { error: 'You do not have permission to download this ticket' },
        { status: 403 }
      );
    }

    // Obtener información del evento
    const event = await Event.findById(ticket.eventId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Generar PDF
    const pdfBuffer = await generateTicketPDF(ticket, event);
    
    // Devolver el PDF como respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${event.name.replace(/\s+/g, '-')}-${ticketId.slice(-6)}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}