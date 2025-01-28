// app/(dashboard)/admin/page.tsx
import { Card } from '@/components/ui/Card'
import { Calendar, Ticket, DollarSign, TrendingUp, Users, Clock } from 'lucide-react'
import { Event } from '@/app/models/Event'
import { Ticket as TicketModel } from '@/app/models/Ticket'
import { getServerSession } from 'next-auth'
import { formatCurrency } from '@/app/lib/utils'
import Link from 'next/link'
import { authOptions } from '@/app/lib/auth'
import dbConnect from '@/app/lib/mongodb'

async function getStats() {
  try {
    // Primero conectamos a la DB
    await dbConnect();
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return null

    const now = new Date()

    // Realizar consultas en paralelo para mejorar el rendimiento
    const [activeEvents, tickets, upcomingEvents, recentSales] = await Promise.all([
      // Eventos activos
      Event.countDocuments({
        organizerId: session.user.id,
        status: 'PUBLISHED',
        date: { $gte: now }
      }).lean(),

      // Tickets vendidos
      TicketModel.find({
        userId: session.user.id,
        status: 'PAID'
      }).lean(),

      // Próximos eventos
      Event.find({
        organizerId: session.user.id,
        status: 'PUBLISHED',
        date: { $gte: now }
      })
      .sort({ date: 1 })
      .limit(5)
      .lean(),

      // Últimas ventas
      TicketModel.find({
        userId: session.user.id,
        status: 'PAID'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('eventId')
      .lean()
    ]);

    // Calcular ingresos totales
    const totalRevenue = tickets.reduce((acc, ticket) => acc + ticket.price, 0)

    return {
      activeEvents,
      ticketsSold: tickets.length,
      totalRevenue,
      upcomingEvents,
      recentSales
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// Añadir opciones de caching para la página
export const revalidate = 60; // revalidar cada minuto

export default async function DashboardPage() {
  try {
    const stats = await getStats()
    if (!stats) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">No se pudieron cargar los datos</p>
        </div>
      )
    }


  return (
<div className="space-y-8 p-6">
  <div>
    <div className="flex items-center gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
      <div className="h-10 w-px bg-gray-200"></div>
      <img 
        src="/logo.png" 
        alt="Logo" 
        className="h-14 w-auto object-contain"
      />
    </div>
    <p className="text-gray-500 mt-2">
      Visualiza y gestiona tus eventos y ventas
    </p>
  </div>
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Eventos Activos</p>
                <h3 className="text-3xl font-bold mt-2">{stats.activeEvents}</h3>
                <p className="text-sm text-blue-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Eventos en curso
                </p>
              </div>
              <Calendar className="h-12 w-12 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Tickets Vendidos</p>
                <h3 className="text-3xl font-bold mt-2">{stats.ticketsSold}</h3>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Total de ventas
                </p>
              </div>
              <Ticket className="h-12 w-12 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Ingresos Totales</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-sm text-purple-600 mt-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Ganancias acumuladas
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Eventos y Ventas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Próximos Eventos</h3>
              <Link href="/admin/events" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todos
              </Link>
            </div>
            <div className="space-y-4">
              {stats.upcomingEvents.length > 0 ? (
                stats.upcomingEvents.map((event) => (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link 
                      href={`/admin/events/${event._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Detalles
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay eventos próximos</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Últimas Ventas</h3>
              <Link href="/admin/tickets" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todas
              </Link>
            </div>
            <div className="space-y-4">
              {stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{sale.eventId.name}</p>
                      <p className="text-sm text-gray-500">
                        {sale.buyerInfo.name} - {formatCurrency(sale.price)}
                      </p>
                    </div>
                    <Link 
                      href={`/admin/tickets/${sale._id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Ver ticket
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay ventas recientes</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
 // ... resto del código del return ...
  } catch (error) {
    console.error('Error in DashboardPage:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Ocurrió un error al cargar el dashboard</p>
      </div>
    )
  }
}