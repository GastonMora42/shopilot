// lib/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { validateQR } from './qrGenerator';

export async function createTicketPDF(ticket: any): Promise<Buffer> {
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      // Crear un documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Ticket para ${ticket.eventName}`,
          Author: 'Sistema de Tickets',
          Subject: 'Ticket de evento',
        }
      });

      // Buffer para almacenar el PDF
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer<ArrayBufferLike>) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Crear la cabecera del documento
      doc.fontSize(24).font('Helvetica-Bold').text(ticket.eventName, { align: 'center' });
      doc.moveDown(0.5);

      // Añadir imagen del evento si está disponible
      if (ticket.eventImage) {
        try {
          const imgResponse = await fetch(ticket.eventImage);
          const imgArrayBuffer = await imgResponse.arrayBuffer();
          const imgBuffer = Buffer.from(imgArrayBuffer);
          
          doc.image(imgBuffer, {
            fit: [500, 200],
            align: 'center'
          });
          doc.moveDown();
        } catch (error) {
          console.error('Error loading event image:', error);
          // Continuar sin imagen
        }
      }

      // Información del evento
      doc.fontSize(12).font('Helvetica');
      
      // Sección de información general
      doc.font('Helvetica-Bold').text('INFORMACIÓN DEL EVENTO', { underline: true });
      doc.font('Helvetica').moveDown(0.5);
      
      // Formatear fecha para español
      const eventDate = new Date(ticket.eventDate);
      const formattedDate = eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const formattedTime = eventDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.text(`Fecha: ${formattedDate}`);
      doc.text(`Hora: ${formattedTime}`);
      doc.text(`Ubicación: ${ticket.eventLocation}`);
      doc.moveDown();

      // Información del comprador
      doc.font('Helvetica-Bold').text('INFORMACIÓN DEL COMPRADOR', { underline: true });
      doc.font('Helvetica').moveDown(0.5);
      doc.text(`Nombre: ${ticket.buyerInfo.name}`);
      doc.text(`Email: ${ticket.buyerInfo.email}`);
      doc.moveDown();

      // Detalles de la compra
      doc.font('Helvetica-Bold').text('DETALLES DE LA COMPRA', { underline: true });
      doc.font('Helvetica').moveDown(0.5);
      
      if (ticket.eventType === 'SEATED') {
        doc.text(`Tipo: Asientos numerados`);
        doc.text(`Asientos: ${ticket.seats.join(', ')}`);
      } else {
        doc.text(`Tipo: Entrada general`);
        doc.text(`Tipo de entrada: ${ticket.ticketType.name}`);
        doc.text(`Cantidad: ${ticket.quantity}`);
      }
      
      doc.text(`Precio total: $${ticket.price}`);
      doc.text(`Estado: ${getStatusLabel(ticket.status)}`);
      doc.moveDown(2);

      // Generar página por cada QR
      if (ticket.qrTickets && ticket.qrTickets.length > 0) {
        let isFirstQR = true;
        
        for (const qrTicket of ticket.qrTickets) {
          // Solo incluir QRs pagados
          if (qrTicket.status !== 'PAID') continue;
          
          // Nueva página para cada QR excepto el primero
          if (!isFirstQR) {
            doc.addPage();
          } else {
            isFirstQR = false;
          }

          doc.font('Helvetica-Bold').fontSize(16).text('CÓDIGO QR DE ENTRADA', { align: 'center' });
          doc.moveDown();

          // Información específica del ticket
          if (ticket.eventType === 'SEATED') {
            doc.fontSize(14).text(`Asiento: ${qrTicket.seatInfo?.seat}`, { align: 'center' });
          } else {
            doc.fontSize(14).text(`Entrada ${(qrTicket.generalInfo?.index ?? 0) + 1} de ${ticket.quantity}`, { align: 'center' });
            doc.text(`Tipo: ${qrTicket.generalInfo?.ticketType}`, { align: 'center' });
          }
          doc.moveDown();

          // Generar y añadir el código QR
          try {
            const qrCodeDataURL = await QRCode.toDataURL(qrTicket.qrCode, {
              errorCorrectionLevel: 'H',
              margin: 1,
              width: 300
            });
            
            doc.image(qrCodeDataURL, {
              fit: [250, 250],
              align: 'center'
            });
            
            // Añadir ID del ticket para referencia
            doc.moveDown();
            doc.fontSize(10).text(`ID: ${qrTicket.subTicketId.slice(-8)}`, { align: 'center' });
            
            // Información de validación y uso
            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica');
            doc.text('Este código QR debe ser presentado en el evento para acceder.', { align: 'center' });
            doc.text('No lo comparta con otras personas.', { align: 'center' });
          } catch (error) {
            console.error('Error generating QR code:', error);
            doc.text('Error al generar el código QR', { align: 'center' });
          }
        }
      } else {
        doc.fontSize(14).text('No hay entradas disponibles para descargar.', { align: 'center' });
      }

      // Finalizar documento
      doc.end();
    } catch (error) {
      console.error('Error creating PDF:', error);
      reject(error);
    }
  });
}

// Función auxiliar para obtener etiqueta de estado
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pendiente',
    'PAID': 'Pagado',
    'USED': 'Usado',
    'CANCELLED': 'Cancelado'
  };
  
  return statusMap[status] || status;
}