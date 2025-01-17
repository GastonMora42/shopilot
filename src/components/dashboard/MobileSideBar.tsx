// components/MobileSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: 'grid'
  },
  {
    title: 'Eventos',
    href: '/admin/events',
    icon: 'calendar'
  },
  {
    title: 'Tickets',
    href: '/admin/tickets',
    icon: 'ticket'
  },
  {
    title: 'Credits',
    href: '/admin/credits',
    icon: 'credits'
  },
  {
    title: 'Scanner',
    href: '/admin/scanner',
    icon: 'qr-code'
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: 'settings'
  }
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <h2 className="font-semibold">EventosPro</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100"
              )}
            >
              <span className="w-5 h-5">{/* Ícono correspondiente */}</span>
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}