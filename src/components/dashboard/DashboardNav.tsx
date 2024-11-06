// components/dashboard/DashboardNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, LayoutDashboard, QrCode, Settings, Ticket } from 'lucide-react'
import { cn } from '@/app/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Eventos',
    href: '/admin/events',
    icon: Calendar
  },
  {
    name: 'Tickets',
    href: '/admin/tickets',
    icon: Ticket
  },
  { name: 'Scanner', 
    icon: QrCode, 
    href: '/admin/scanner' 
  },
  {
    name: 'Configuración',
    href: '/admin/settings',
    icon: Settings
  }
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r overflow-y-auto">
      <div className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}