// components/dashboard/DashboardNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, LayoutDashboard, QrCode, Settings, Ticket } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface DashboardNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardNav({ isOpen, onClose }: DashboardNavProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Panel',
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
    { 
      name: 'Scanner', 
      icon: QrCode, 
      href: '/admin/scanner' 
    },
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Settings
    }
  ]

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r pt-16 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="h-full p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose()}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === item.href
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}

