'use client';

import { Card } from '@/components/ui/Card'
import { Calendar, Ticket, DollarSign, TrendingUp, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/app/lib/utils'
import { useState, useEffect } from 'react'

interface DashboardStats {
 activeEvents: number;
 ticketsSold: number;
 totalRevenue: number;
 upcomingEvents: any[];
 recentSales: any[];
}

export default function DashboardPage() {
 const [stats, setStats] = useState<DashboardStats | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   fetchDashboardData();
 }, []);

// En el DashboardPage
const fetchDashboardData = async () => {
  try {
    console.log('🚀 Iniciando fetch de datos');
    const response = await fetch('/api/admin/dashboard');
    console.log('📡 Respuesta recibida:', {
      status: response.status,
      ok: response.ok
    });

    const data = await response.json();
    console.log('📦 Datos recibidos:', data);
    
    setStats(data);
  } catch (error) {
    console.error('❌ Error en cliente:', error);
  } finally {
    setIsLoading(false);
  }
};

 if (isLoading) {
   return (
     <div className="p-8 text-center text-gray-500">
       Cargando datos...
     </div>
   );
 }

 if (!stats) {
   return (
     <div className="p-8 text-center text-gray-500">
       No se pudieron cargar los datos del dashboard
     </div>
   );
 }

 return (
   <div className="space-y-8 p-8">
     <div>
       <div className="flex items-center gap-6">
         <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
         <div className="h-10 w-px bg-gray-200"></div>
         <img 
           src="/logo.png" 
           alt="Logo" 
           className="h-20 md:h-24 lg:h-28 w-auto object-contain"
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

       <Card className="bg-gradient-to-br from-[#a5dcfd]/20 to-white">
         <div className="p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-[#0087ca]">Tickets Vendidos</p>
               <h3 className="text-3xl font-bold mt-2">{stats.ticketsSold}</h3>
               <p className="text-sm text-[#0087ca] mt-2 flex items-center">
                 <Users className="h-4 w-4 mr-1" />
                 Total de ventas
               </p>
             </div>
             <Ticket className="h-12 w-12 text-[#0087ca]" />
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
             <Link 
               href="/admin/events" 
               className="text-[#0087ca] hover:text-[#a5dcfd] transition-colors text-sm"
             >
               Ver todos
             </Link>
           </div>
           <div className="space-y-4">
             {stats.upcomingEvents.length > 0 ? (
               stats.upcomingEvents.map((event) => (
                 <div key={event._id.toString()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-[#a5dcfd]/5 transition-colors">
                   <div className="flex items-center gap-4">
                     <Clock className="h-5 w-5 text-gray-400" />
                     <div>
                       <p className="font-medium">{event.name}</p>
                       <p className="text-sm text-gray-500">
                         {new Date(event.date).toLocaleDateString('es-ES', {
                           day: 'numeric',
                           month: 'long',
                           year: 'numeric'
                         })}
                       </p>
                     </div>
                   </div>
                   <Link 
                     href={`/admin/events/${event._id}`}
                     className="text-sm text-[#0087ca] hover:text-[#a5dcfd] transition-colors"
                   >
                     Detalles
                   </Link>
                 </div>
               ))
             ) : (
               <p className="text-gray-500 text-sm text-center py-4">
                 No hay eventos próximos programados
               </p>
             )}
           </div>
         </div>
       </Card>

       <Card>
         <div className="p-6">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-semibold">Últimas Ventas</h3>
             <Link 
               href="/admin/tickets" 
               className="text-[#0087ca] hover:text-[#a5dcfd] transition-colors text-sm"
             >
               Ver todas
             </Link>
           </div>
           <div className="space-y-4">
             {stats.recentSales.length > 0 ? (
               stats.recentSales.map((sale) => (
                 <div key={sale._id.toString()} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-[#a5dcfd]/5 transition-colors">
                   <div>
                     <p className="font-medium">{sale.eventId.name}</p>
                     <p className="text-sm text-gray-500">
                       {sale.buyerInfo.name} - {formatCurrency(sale.price)}
                     </p>
                   </div>
                   <Link 
                     href={`/admin/tickets/${sale._id}`}
                     className="text-sm text-[#0087ca] hover:text-[#a5dcfd] transition-colors"
                   >
                     Ver ticket
                   </Link>
                 </div>
               ))
             ) : (
               <p className="text-gray-500 text-sm text-center py-4">
                 No hay ventas recientes
               </p>
             )}
           </div>
         </div>
       </Card>
     </div>
   </div>
 );
}