// app/(dashboard)/admin/page.tsx
import { Card } from '@/components/ui/Card'
import { Calendar, Ticket, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de Control</h1>
        <p className="text-gray-500 mt-2">
          Bienvenido al panel de administración de eventos.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Activos</p>
                <h3 className="text-2xl font-semibold mt-1">12</h3>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Vendidos</p>
                <h3 className="text-2xl font-semibold mt-1">248</h3>
              </div>
              <Ticket className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <h3 className="text-2xl font-semibold mt-1">$15,240</h3>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Próximos Eventos</h3>
            <div className="space-y-4">
              {/* Lista de eventos próximos */}
              <p className="text-gray-500 text-sm">No hay eventos próximos</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Últimas Ventas</h3>
            <div className="space-y-4">
              {/* Lista de últimas ventas */}
              <p className="text-gray-500 text-sm">No hay ventas recientes</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}