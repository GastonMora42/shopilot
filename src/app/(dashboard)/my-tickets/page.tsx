// app/my-tickets/page.tsx
'use client'

import { SetStateAction, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  MailIcon, 
  ClockIcon,
  TicketIcon,
  SpaceIcon,
  HashIcon,
  PrinterIcon,
  DownloadIcon,
  SearchIcon,
  Loader2Icon
} from 'lucide-react'

interface QRTicket {
  subTicketId: string;
  qrCode: string;
  qrValidation: string;
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  type: 'SEATED' | 'GENERAL';
  seatInfo?: {
    seat: string;
  };
  generalInfo?: {
    ticketType: string;
    index: number;
  };
}

interface BaseTicket {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  eventType: 'SEATED' | 'GENERAL';
  status: 'PENDING' | 'PAID' | 'USED' | 'CANCELLED';
  price: number;
  buyerInfo: {
    name: string;
    email: string;
  };
  createdAt: string;
  qrTickets: QRTicket[];
}

interface SeatedTicket extends BaseTicket {
  eventType: 'SEATED';
  seats: string[];
}

interface GeneralTicket extends BaseTicket {
  eventType: 'GENERAL';
  ticketType: {
    name: string;
    price: number;
  };
  quantity: number;
}

type Ticket = SeatedTicket | GeneralTicket;

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'yellow' },
  PAID: { label: 'Pagado', color: 'green' },
  USED: { label: 'Usado', color: 'gray' },
  CANCELLED: { label: 'Cancelado', color: 'red' }
} as const;

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const config = statusConfig[status];
  return (
    <Badge color={config.color}>
      {config.label}
    </Badge>
  );
}

function QRTicketDisplay({ qrTicket, eventType }: { qrTicket: QRTicket; eventType: 'SEATED' | 'GENERAL' }) {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          {eventType === 'SEATED' ? (
            <p className="font-medium">Asiento: {qrTicket.seatInfo?.seat}</p>
          ) : (
            <p className="font-medium">
              Entrada {qrTicket.generalInfo?.index! + 1}
            </p>
          )}
        </div>
        <StatusBadge status={qrTicket.status} />
      </div>
      
      {qrTicket.status === 'PAID' && (
        <div className="flex flex-col items-center mt-2">
          <QRCodeSVG 
            value={qrTicket.qrCode}
            size={150}
            level="H"
            includeMargin={true}
          />
          <p className="text-sm text-gray-500 mt-2">
            ID: {qrTicket.subTicketId.slice(-8)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | ''>('')
  const [sortOrder, setSortOrder] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [printingTicket, setPrintingTicket] = useState<string | null>(null)

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
      setIsLoading(true)
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

  const filterAndSortTickets = () => {
    let filteredTickets = [...tickets]

    if (searchTerm) {
      filteredTickets = filteredTickets.filter(ticket =>
        ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.status === statusFilter
      )
    }

    if (sortOrder) {
      filteredTickets.sort((a, b) => {
        switch (sortOrder) {
          case 'date-desc':
            return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
          case 'date-asc':
            return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          case 'name':
            return a.eventName.localeCompare(b.eventName)
          default:
            return 0
        }
      })
    }

    return filteredTickets
  }

  const handleDownloadPDF = async (ticket: Ticket) => {
    try {
      setDownloadingPdf(ticket.id)
      
      // Solicitud más específica al backend
      const response = await fetch('/api/tickets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: ticket.id,
          format: 'pdf',
          includeQR: true
        })
      })
  
      if (!response.ok) throw new Error('Error downloading ticket')
  
      // Obtener el blob directamente
      const blob = await response.blob()
      
      // Crear un enlace de descarga directo
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-${ticket.id}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Limpiar recursos
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading ticket:', error)
      alert('No se pudo descargar el ticket. Por favor, intenta de nuevo.')
    } finally {
      setDownloadingPdf(null)
    }
  }

  const handlePrint = async (ticket: Ticket) => {
    try {
      setPrintingTicket(ticket.id)
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
  
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tickets - ${ticket.eventName}</title>
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; }
              .ticket { 
                page-break-after: always;
                padding: 20px;
                border: 1px solid #ccc;
                margin-bottom: 20px;
              }
              .qr-container { text-align: center; margin: 20px 0; }
              .ticket-info { margin: 20px 0; }
            </style>
          </head>
          <body>
            ${ticket.qrTickets.map(qrTicket => `
              <div class="ticket">
                <h1>${ticket.eventName}</h1>
                <div class="ticket-info">
                  <p>Fecha: ${format(new Date(ticket.eventDate), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}</p>
                  <p>Ubicación: ${ticket.eventLocation}</p>
                  <p>Comprador: ${ticket.buyerInfo.name}</p>
                  <p>Email: ${ticket.buyerInfo.email}</p>
                  ${ticket.eventType === 'SEATED' 
                    ? `<p>Asiento: ${qrTicket.seatInfo?.seat}</p>`
                    : `<p>Tipo: ${ticket.ticketType.name}</p>
                       <p>Entrada ${(qrTicket.generalInfo?.index ?? 0) + 1} de ${ticket.quantity}`
                  }
                </div>
                ${qrTicket.status === 'PAID' ? `
                  <div class="qr-container">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      <foreignObject width="100%" height="100%">
                        ${QRCodeSVG({
                          value: qrTicket.qrCode,
                          size: 200,
                          level: 'H'
                        })}
                      </foreignObject>
                    </svg>
                    <p>ID: ${qrTicket.subTicketId.slice(-8)}</p>
                  </div>
                ` : ''}
                <div class="ticket-status">
                  Estado: ${statusConfig[qrTicket.status].label}
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `
  
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error al preparar la impresión:', error)
    } finally {
      setPrintingTicket(null)
    }
  }

  if (isLoading) {
    return <TicketsSkeleton />
  }

  const filteredTickets = filterAndSortTickets()

  if (!tickets.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <TicketIcon className="w-12 h-12 text-gray-400 mb-4" />
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
      {/* Header y Filtros */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Tickets</h1>
        <div className="flex gap-2">
          {Object.entries(statusConfig).map(([key, value]) => (
            <StatusBadge key={key} status={key as Ticket['status']} />
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre de evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Ticket['status'] | '')}
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusConfig).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </Select>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Ordenar por</option>
            <option value="date-desc">Fecha más reciente</option>
            <option value="date-asc">Fecha más antigua</option>
            <option value="name">Nombre del evento</option>
          </Select>
        </div>
      </div>

      {/* Lista de Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image
                src={ticket.eventImage}
                alt={ticket.eventName}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2">
                <StatusBadge status={ticket.status} />
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold truncate">{ticket.eventName}</h2>
                <div className="space-y-1 text-sm text-gray-500">
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(new Date(ticket.eventDate), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    {ticket.eventLocation}
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                {ticket.eventType === 'SEATED' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SpaceIcon className="w-4 h-4" />
                      <p>Asientos: {ticket.seats.join(', ')}</p>
                    </div>
                  </div>
) : (
  <div className="space-y-1">
    <p className="flex items-center gap-2">
      <TicketIcon className="w-4 h-4" />
      Tipo: {ticket.ticketType.name}
    </p>
    <p className="flex items-center gap-2">
      <HashIcon className="w-4 h-4" />
      Cantidad: {ticket.quantity}
    </p>
  </div>
)}
<p className="font-semibold mt-2">Total: ${ticket.price}</p>
</div>

{/* QRs individuales */}
{ticket.status === 'PAID' && (
<div className="space-y-4">
  {ticket.qrTickets.map((qrTicket) => (
    <QRTicketDisplay 
      key={qrTicket.subTicketId}
      qrTicket={qrTicket}
      eventType={ticket.eventType}
    />
  ))}
</div>
)}

<div className="text-sm text-gray-500 space-y-1 border-t pt-4">
<div className="flex items-center gap-2">
  <UserIcon className="w-4 h-4" />
  <p>{ticket.buyerInfo.name}</p>
</div>
<div className="flex items-center gap-2">
  <MailIcon className="w-4 h-4" />
  <p>{ticket.buyerInfo.email}</p>
</div>
<div className="flex items-center gap-2">
  <ClockIcon className="w-4 h-4" />
  <p>Comprado el {format(new Date(ticket.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
</div>
</div>

<div className="mt-4">
  {ticket.status === 'PAID' && (
    <Button 
      onClick={() => handleDownloadPDF(ticket)}
      className="w-full"
      disabled={downloadingPdf === ticket.id}
    >
      {downloadingPdf === ticket.id ? (
        <span className="flex items-center justify-center">
          <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
          Descargando...
        </span>
      ) : (
        <>
          <DownloadIcon className="w-4 h-4 mr-2" />
          Descargar PDF
        </>
      )}
    </Button>
  )}
</div>
</div>
</Card>
))}
</div>
</div>
);
}

function TicketsSkeleton() {
return (
<div className="container mx-auto px-4 py-8">
<div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{[1, 2, 3].map((n) => (
<div key={n} className="h-[600px] bg-gray-200 rounded animate-pulse" />
))}
</div>
</div>
);
}