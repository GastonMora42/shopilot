'use client'
import { useSession, signOut } from 'next-auth/react'
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, LogOut, Menu, Settings, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { DropdownMenuLabel } from '../ui/drop-downmenu/DropdownMenuLabel'
import { DropdownMenuSeparator } from '../ui/drop-downmenu/DropdownMenuSeparator'

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
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/">
  <img 
    src="/logo.png" 
    alt="Logo" 
    className="h-16 md:h-20 lg:h-24 xl:h-28 w-auto object-contain md:max-w-[500px] lg:max-w-[600px] xl:max-w-[800px]"
  />
</Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative w-10 h-10 rounded-full overflow-hidden"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-700" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
  <DropdownMenuLabel>
    <div className="flex flex-col space-y-1 p-2">
      <p className="text-sm font-medium">{session?.user?.name}</p>
      <p className="text-xs text-gray-500">{session?.user?.email}</p>
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem>
    <Link 
      href="/admin/settings" 
      className="flex items-center gap-2 w-full p-2 hover:bg-[#a5dcfd]/10 transition-colors rounded-md"
    >
      <Settings className="h-4 w-4 text-gray-500" />
      <span>Configuración</span>
    </Link>
  </DropdownMenuItem>
  <DropdownMenuItem>
    <Link 
      href="/blog" 
      className="flex items-center gap-2 w-full p-2 hover:bg-[#a5dcfd]/10 transition-colors rounded-md"
    >
      <BookOpen className="h-4 w-4 text-gray-500" />
      <span>Tutorial Rápido</span>
    </Link>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem>
    <div 
      onClick={handleSignOut} 
      className="flex items-center gap-2 w-full p-2 hover:bg-[#a5dcfd]/10 transition-colors rounded-md cursor-pointer"
    >
      <LogOut className="h-4 w-4 text-gray-500" />
      <span>Cerrar Sesión</span>
    </div>
  </DropdownMenuItem>
</DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}