'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Calendar, 
  LayoutDashboard, 
  QrCode, 
  Settings, 
  Ticket, 
  CreditCard,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

interface DashboardNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardNav({ isOpen, onClose }: DashboardNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const mainNavigation = [
    {
      name: 'Panel',
      href: '/admin',
      icon: LayoutDashboard,
      description: 'Vista general de tu cuenta'
    },
    {
      name: 'Eventos',
      href: '/admin/events',
      icon: Calendar,
      description: 'Gestiona tus eventos'
    },
    {
      name: 'Tickets',
      href: '/admin/tickets',
      icon: Ticket,
      description: 'Administra tus tickets'
    }
  ]

  const secondaryNavigation = [
    {
      name: 'Mis Tickets',
      href: '/my-tickets',
      icon: Ticket,
      description: 'Tickets que has comprado'
    },
    {
      name: 'Créditos',
      href: '/admin/credits',
      icon: CreditCard,
      description: 'Gestiona tus créditos'
    },
    { 
      name: 'Scanner', 
      icon: QrCode, 
      href: '/admin/scanner',
      description: 'Escanea tickets en eventos'
    }
  ]

  const settingsNavigation = [
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Settings,
      description: 'Ajustes de tu cuenta'
    }
  ]

  const NavLink = ({ item }: { item: typeof mainNavigation[0] }) => (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        "hover:bg-gray-50",
        pathname === item.href
          ? "bg-black text-white hover:bg-black/90"
          : "text-gray-700"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 transition-colors shrink-0",
        pathname === item.href ? "text-white" : "text-gray-500 group-hover:text-gray-700"
      )} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name}</p>
        <p className={cn(
          "text-xs truncate",
          pathname === item.href ? "text-white/80" : "text-gray-500"
        )}>
          {item.description}
        </p>
      </div>
      <ChevronRight className={cn(
        "h-4 w-4 opacity-0 transition-all shrink-0",
        "group-hover:opacity-100 group-hover:translate-x-1",
        pathname === item.href ? "text-white opacity-100" : "text-gray-400"
      )} />
    </Link>
  )

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 md:w-72 lg:w-80 bg-white border-r transform transition-all duration-300 ease-in-out",
          "flex flex-col",
          "shadow-sm",
          "top-16 pb-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Section */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <div className="relative w-9 h-9 shrink-0">
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="p-4 space-y-6">
              <div>
                <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Principal
                </h2>
                <div className="mt-2 space-y-1">
                  {mainNavigation.map(item => <NavLink key={item.name} item={item} />)}
                </div>
              </div>
              <div>
                <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mis Compras
                </h2>
                <div className="mt-2 space-y-1">
                  {secondaryNavigation.map(item => <NavLink key={item.name} item={item} />)}
                </div>
              </div>
              <div>
                <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ajustes
                </h2>
                <div className="mt-2 space-y-1">
                  {settingsNavigation.map(item => <NavLink key={item.name} item={item} />)}
                </div>
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t mt-auto">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="truncate">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}