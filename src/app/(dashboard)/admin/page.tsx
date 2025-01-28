// app/(dashboard)/admin/page.tsx
import { Card } from '@/components/ui/Card'
import { Calendar, Ticket, DollarSign, TrendingUp, Users, Clock } from 'lucide-react'
import { Event } from '@/app/models/Event'
import { Ticket as TicketModel } from '@/app/models/Ticket'
import { getServerSession } from 'next-auth'
import { formatCurrency } from '@/app/lib/utils'
import Link from 'next/link'
import { authOptions } from '@/app/lib/auth'
import { Types } from 'mongoose'
import dbConnect from '@/app/lib/mongodb'
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode } from 'react'

interface DashboardStats {
  activeEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  upcomingEvents: Event[];
  recentSales: Sale[];
}

interface Event {
 _id: Types.ObjectId;
 name: string;
 date: Date;
}

interface Sale {
 _id: Types.ObjectId;
 eventId: {
   name: string;
 };
 buyerInfo: {
   name: string;
 };
 price: number;
}

async function getStats() {
 try {
   await dbConnect();
   
   const session = await getServerSession(authOptions)
   if (!session?.user?.email) return null

   const now = new Date()

   const [activeEvents, tickets, upcomingEvents, recentSales] = await Promise.all([
     Event.countDocuments({
       organizerId: session.user.id,
       status: 'PUBLISHED',
       date: { $gte: now }
     }),

     TicketModel.find({
       userId: session.user.id,
       status: 'PAID'
     }),

     Event.find({
       organizerId: session.user.id,
       status: 'PUBLISHED',
       date: { $gte: now }
     })
     .sort({ date: 1 })
     .limit(5),

     TicketModel.find({
       userId: session.user.id,
       status: 'PAID'
     })
     .sort({ createdAt: -1 })
     .limit(5)
     .populate('eventId')
   ]);

   const totalRevenue = tickets.reduce((acc, ticket) => acc + ticket.price, 0)

   return {
     activeEvents,
     ticketsSold: tickets.length,
     totalRevenue,
     upcomingEvents,
     recentSales
   }
 } catch (error) {
   console.error('Error fetching stats:', error)
   return {
     activeEvents: 0,
     ticketsSold: 0,
     totalRevenue: 0,
     upcomingEvents: [],
     recentSales: []
   }
 }
}

function LoadingSkeleton() {
 return (
   <div className="animate-pulse space-y-8 p-6">
     {/* Header Skeleton */}
     <div className="flex items-center gap-6">
       <div className="h-10 w-48 bg-gray-200 rounded"></div>
       <div className="h-10 w-px bg-gray-200"></div>
       <div className="h-14 w-32 bg-gray-200 rounded"></div>
     </div>

     {/* Metrics Skeleton */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       {[1, 2, 3].map((i) => (
         <div key={i} className="bg-white p-6 rounded-lg shadow">
           <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
           <div className="h-8 w-16 bg-gray-200 rounded"></div>
         </div>
       ))}
     </div>

     {/* Lists Skeleton */}
     <div className="grid md:grid-cols-2 gap-6">
       {[1, 2].map((i) => (
         <div key={i} className="bg-white p-6 rounded-lg shadow">
           <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
           <div className="space-y-4">
             {[1, 2, 3].map((j) => (
               <div key={j} className="h-16 bg-gray-200 rounded"></div>
             ))}
           </div>
         </div>
       ))}
     </div>
   </div>
 );
}

export default async function DashboardPage() {
  try {
    let fetchStats = getStats();
    let timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    let stats: DashboardStats | null = null;
    
    try {
      stats = (await Promise.race([fetchStats, timeoutPromise])) as DashboardStats;
    } catch (error) {
      console.error('Timeout or error fetching stats:', error);
    }

    // Si no hay stats, usamos valores por defecto
    if (!stats) {
      stats = {
        activeEvents: 0,
        ticketsSold: 0,
        totalRevenue: 0,
        upcomingEvents: [],
        recentSales: []
      };
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
    <div key={event._id.toString()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        href={`/admin/events/${event._id.toString()}`}
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
    <div key={sale._id.toString()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium">{sale.eventId.name}</p>
        <p className="text-sm text-gray-500">
          {sale.buyerInfo.name} - {formatCurrency(sale.price)}
        </p>
      </div>
      <Link 
        href={`/admin/tickets/${sale._id.toString()}`}
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
 } catch (error) {
   console.error('Error in DashboardPage:', error)
   
   // En caso de error, mostramos la página con el skeleton loading
   return <LoadingSkeleton />;
 }
}