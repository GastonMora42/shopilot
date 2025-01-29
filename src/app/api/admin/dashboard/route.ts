// app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Ticket } from '@/app/models/Ticket';
import { Event } from '@/app/models/Event';

// app/api/admin/dashboard/route.ts
export async function GET(_req: Request) {
    try {
      console.log('🚀 Iniciando solicitud dashboard');
      
      const session = await getServerSession(authOptions);
      console.log('📘 Sesión:', {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
  
      if (!session?.user?.email) {
        console.log('❌ No hay sesión autorizada');
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }
  
      await dbConnect();
      console.log('🔌 Conexión a DB establecida');
  
      const now = new Date();
  
      // Primero obtenemos los eventos del organizador
      const userEvents = await Event.find({ 
        organizerId: session.user.id 
      });
      const eventIds = userEvents.map(event => event._id);
  
      console.log('🎯 IDs de eventos encontrados:', eventIds);
  
      // Eventos activos (usando la fecha actual)
      const activeEvents = await Event.countDocuments({
        _id: { $in: eventIds },
        status: 'PUBLISHED',
        date: { $gte: now }
      });
  
      // Tickets vendidos para estos eventos
      const tickets = await Ticket.find({
        eventId: { $in: eventIds },
        status: { $in: ['PAID', 'USED'] }
      }).populate('eventId', 'name');
  
      const ticketsSold = tickets.length;
      const totalRevenue = tickets.reduce((sum, ticket) => 
        sum + (ticket.totalPrice || ticket.price), 0
      );
  
      // Próximos eventos
      const upcomingEvents = await Event.find({
        _id: { $in: eventIds },
        status: 'PUBLISHED',
        date: { $gte: now }
      })
      .sort({ date: 1 })
      .limit(5)
      .select('name date location status imageUrl');
  
      // Últimas ventas
      const recentSales = await Ticket.find({
        eventId: { $in: eventIds },
        status: { $in: ['PAID', 'USED'] }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('eventId', 'name')
      .select('eventId buyerInfo price createdAt status');
  
      console.log('📊 Dashboard Stats:', {
        activeEvents,
        ticketsSold,
        totalRevenue,
        upcomingEventsCount: upcomingEvents.length,
        recentSalesCount: recentSales.length
      });
  
      return NextResponse.json({
        success: true,
        activeEvents,
        ticketsSold,
        totalRevenue,
        upcomingEvents: upcomingEvents.map(event => ({
          _id: event._id,
          name: event.name,
          date: event.date,
          location: event.location,
          status: event.status,
          imageUrl: event.imageUrl
        })),
        recentSales: recentSales.map(sale => ({
          _id: sale._id,
          eventId: {
            _id: sale.eventId?._id,
            name: sale.eventId?.name
          },
          buyerInfo: sale.buyerInfo,
          price: sale.price,
          status: sale.status,
          createdAt: sale.createdAt
        }))
      });
  
    } catch (error) {
      console.error('❌ Error en dashboard:', error);
      console.error('Stack trace:', (error as Error).stack);
      return NextResponse.json(
        { error: 'Error al obtener datos del dashboard' },
        { status: 500 }
      );
    }
  }