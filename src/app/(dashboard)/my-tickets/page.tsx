// app/dashboard/my-tickets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react' // Cambiamos QRCode por QRCodeSVG
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

interface Ticket {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  seats?: string[];
  ticketType?: {
    name: string;
    price: number;
  };
  quantity?: number;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  qrCode: string;
  price: number;
  buyerInfo: {
    name: string;
    email: string;
  };
  createdAt: string;
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const statusConfig = {
    PENDING: { label: 'Pendiente', color: 'yellow' },
    PAID: { label: 'Pagado', color: 'green' },
    USED: { label: 'Usado', color: 'gray' },
    CANCELLED: { label: 'Cancelado', color: 'red' }
  }

  return (
    <Badge color={statusConfig[status].color}>
      {statusConfig[status].label}
    </Badge>
  )
}

export default function MyTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }

    if (session?.user) {
      fetchTickets()
    }
  }, [session, status, router])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/users/tickets')
      if (!response.ok) throw new Error('Error fetching tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <TicketsSkeleton />
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Mis Tickets</h1>
        <p className="text-gray-500 text-center">
          No tienes tickets comprados aún.
          <br />
          ¡Explora nuestros eventos y compra tu primer ticket!
        </p>
        <Button 
          onClick={() => router.push('/events')}
          className="mt-4"
        >
          Ver eventos
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis Tickets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden">
            <div className="relative h-48">
              <Image
                src={ticket.eventImage}
                alt={ticket.eventName}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{ticket.eventName}</h2>
                  <p className="text-gray-500">
                    {format(new Date(ticket.eventDate), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </p>
                  <p className="text-gray-500">{ticket.eventLocation}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              <div className="mb-4">
                {ticket.seats ? (
                  <p>Asientos: {ticket.seats.join(', ')}</p>
                ) : (
                  <p>Cantidad: {ticket.quantity}</p>
                )}
                <p className="font-semibold">Total: ${ticket.price}</p>
              </div>

              {ticket.status === 'PAID' && (
                <div className="flex justify-center mb-4">
                      <QRCodeSVG 
      value={ticket.qrCode} 
      size={200}
      level="H" // Mejor corrección de errores
      includeMargin={true}
    />
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Comprador: {ticket.buyerInfo.name}</p>
                <p>Email: {ticket.buyerInfo.email}</p>
                <p>Fecha de compra: {
                  format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy", { locale: es })
                }</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TicketsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-[600px]" />
        ))}
      </div>
    </div>
  )
}