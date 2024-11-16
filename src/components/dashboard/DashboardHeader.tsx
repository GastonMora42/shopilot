// components/dashboard/DashboardHeader.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, User } from 'lucide-react'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-30">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>
                <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-18 w-auto object-contain max-w-[180px]" /* Ajustes principales aquí */
              />
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="font-normal">
                <br />
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <button
                  className="w-full text-left cursor-pointer"
                  onClick={handleSignOut}
                >
                  Cerrar Sesión
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

