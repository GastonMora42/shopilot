// src/components/admin/PendingTransferTickets.tsx
import Image from 'next/image';
// src/components/admin/PendingTransferTickets.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate, formatCurrency } from '@/app/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Loader2, 
  Clock, 
  Search, 
  Trash2, 
  ZoomIn,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '../ui/Alert';
import { Tooltip } from '../ui/ToolTip';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';

type TicketStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface PendingTicket {
  id: string;
  eventName: string;
  buyerName: string;
  buyerEmail: string;
  price: number;
  seats?: string[];
  ticketType?: {
    name: string;
    quantity: number;
  };
  createdAt: string;
  transferProof: {
    imageUrl: string;
    notes?: string;
    uploadedAt: string;
  };
  status?: TicketStatus;
}

export function PendingTransferTickets() {
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<PendingTicket | null>(null);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);
  
  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, activeTab]);
  
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tickets/pending');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Asegurarse de que todos los tickets tengan un status
      const ticketsWithStatus = (data.tickets || []).map((ticket: PendingTicket) => ({
        ...ticket,
        status: ticket.status || 'PENDING'
      }));
      
      setTickets(ticketsWithStatus);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar tickets');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterTickets = () => {
    let result = [...tickets];
    
    // Filtrar por pestaña activa
    if (activeTab === 'pending') {
      result = result.filter(ticket => ticket.status === 'PENDING');
    } else if (activeTab === 'approved') {
      result = result.filter(ticket => ticket.status === 'APPROVED');
    } else if (activeTab === 'rejected') {
      result = result.filter(ticket => ticket.status === 'REJECTED');
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.eventName.toLowerCase().includes(query) ||
        ticket.buyerName.toLowerCase().includes(query) ||
        ticket.buyerEmail.toLowerCase().includes(query) ||
        (ticket.seats && ticket.seats.join(' ').toLowerCase().includes(query)) ||
        (ticket.ticketType?.name && ticket.ticketType.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredTickets(result);
  };

  const handleApprove = async (ticketId: string) => {
    try {
      setProcessingTicketId(ticketId);
      
      const response = await fetch('/api/tickets/approve-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId, 
          approve: true 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aprobar el ticket');
      }
      
      // Actualizar localmente en lugar de recargar todos los tickets
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'APPROVED' } 
          : ticket
      ));
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error al aprobar el ticket');
    } finally {
      setProcessingTicketId(null);
      // No cerramos los modales para que se vea la actualización del estado
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) return;
    
    try {
      setProcessingTicketId(selectedTicket.id);
      
      const response = await fetch('/api/tickets/approve-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: selectedTicket.id, 
          approve: false,
          rejectionReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al rechazar el ticket');
      }
      
      // Actualizar localmente
      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, status: 'REJECTED' } 
          : ticket
      ));
      
      setShowRejectionDialog(false);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error al rechazar el ticket');
    } finally {
      setProcessingTicketId(null);
    }
  };
  
  const handleDelete = async (ticketId: string) => {
    // Implementación de la eliminación visual (no real)
    setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
  };
  
  const toggleExpandTicket = (ticketId: string) => {
    setExpandedTicket(prev => prev === ticketId ? null : ticketId);
  };

  // Renderizar estado del ticket
  const renderStatus = (status: TicketStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle size={12} />
            Aprobado
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle size={12} />
            Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={12} />
            Pendiente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-10 w-10 border-4 border-[#0087ca] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Cargando tickets pendientes...</p>
      </div>
    );
  }

  const pendingCount = tickets.filter(t => t.status === 'PENDING').length;
  const approvedCount = tickets.filter(t => t.status === 'APPROVED').length;
  const rejectedCount = tickets.filter(t => t.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <p>Error</p>
          <p>{error}</p>
          <Button 
            onClick={fetchTickets} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Reintentar
          </Button>
        </Alert>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full md:w-auto"
        >
          <TabsList className="w-full md:w-auto grid grid-cols-4">
            <TabsTrigger value="all">
              Todos ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprobados ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazados ({rejectedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-64">
          <Input
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full md:w-auto"
        >      
        <TabsContent value={activeTab} className="mt-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            {searchQuery 
              ? 'No se encontraron tickets que coincidan con la búsqueda'
              : `No hay tickets ${activeTab === 'pending' 
                  ? 'pendientes' 
                  : activeTab === 'approved' 
                    ? 'aprobados' 
                    : activeTab === 'rejected' 
                      ? 'rechazados' 
                      : ''}`
            }
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`overflow-hidden transition-all ${
                      ticket.status === 'APPROVED' ? 'border-green-200 bg-green-50/30' :
                      ticket.status === 'REJECTED' ? 'border-red-200 bg-red-50/30' : 
                      'border-gray-200'
                    }`}
                  >
                    <div className="p-4 cursor-pointer" onClick={() => toggleExpandTicket(ticket.id)}>
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className="bg-gray-100 rounded-md w-16 h-16 flex-shrink-0 relative overflow-hidden"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setImageModalOpen(true);
                            }}
                          >
                            {ticket.transferProof?.imageUrl ? (
                              <>
                                <img
                                  src={ticket.transferProof.imageUrl}
                                  alt="Comprobante"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <ZoomIn className="text-white" size={20} />
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Eye className="text-gray-400" size={20} />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold truncate">{ticket.eventName}</h3>
                              {renderStatus(ticket.status || 'PENDING')}
                            </div>
                            <p className="text-sm text-gray-600">{ticket.buyerName}</p>
                            <p className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-3 md:mt-0 space-x-3">
                          <span className="font-medium">{formatCurrency(ticket.price)}</span>
                          <ChevronDown 
                            className={`transition-transform ${expandedTicket === ticket.id ? 'rotate-180' : ''}`} 
                            size={16}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {expandedTicket === ticket.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-2 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Detalles</h4>
                            <p className="text-sm mb-1">
                              <span className="font-medium">Comprador:</span> {ticket.buyerName} ({ticket.buyerEmail})
                            </p>
                            {ticket.seats ? (
                              <p className="text-sm mb-1">
                                <span className="font-medium">Asientos:</span> {ticket.seats.join(', ')}
                              </p>
                            ) : (
                              <p className="text-sm mb-1">
                                <span className="font-medium">Tickets:</span> {ticket.ticketType?.quantity}x {ticket.ticketType?.name}
                              </p>
                            )}
                            {ticket.transferProof?.notes && (
                              <div className="mt-2">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Notas:</h4>
                                <p className="text-sm bg-white p-2 rounded border border-gray-100">
                                  {ticket.transferProof.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {ticket.status === 'PENDING' && (
                            <div className="flex flex-wrap gap-2 items-start justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(ticket);
                                  setImageModalOpen(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Eye size={14} />
                                Ver comprobante
                              </Button>
                              
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(ticket.id);
                                }}
                                disabled={processingTicketId === ticket.id}
                              >
                                {processingTicketId === ticket.id ? (
                                  <>
                                    <Loader2 className="animate-spin h-3 w-3 mr-1" />
                                    Aprobando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={14} className="mr-1" />
                                    Aprobar
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(ticket);
                                  setShowRejectionDialog(true);
                                }}
                                disabled={processingTicketId === ticket.id}
                                className="flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                Rechazar
                              </Button>
                            </div>
                          )}
                          
                          {ticket.status !== 'PENDING' && (
                            <div className="flex justify-end">
                              <Tooltip content="Eliminar de la lista">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(ticket.id);
                                  }}
                                  className="text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>
      </Tabs>

      {/* Modal para ver comprobante */}
      {selectedTicket && imageModalOpen && (
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className={`${isZoomed ? 'max-w-5xl' : 'max-w-2xl'} transition-all duration-300`}>
            <DialogTitle>
              <DialogTitle>Comprobante de transferencia</DialogTitle>
            </DialogTitle>
            
            <div className="overflow-hidden">
              <div 
                className={`
                  ${isZoomed ? 'cursor-zoom-out overflow-auto max-h-[80vh]' : 'cursor-zoom-in'} 
                  bg-gray-100 rounded-lg p-2 flex justify-center
                `}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <img
                  src={selectedTicket.transferProof.imageUrl}
                  alt="Comprobante"
                  className={`${isZoomed ? 'max-w-none scale-125' : 'max-w-full'} 
                    h-auto transition-transform duration-300`}
                />
              </div>
              
              {selectedTicket.transferProof.notes && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Notas del comprador:</h4>
                  <p className="text-sm p-3 bg-gray-50 rounded-md border border-gray-100">
                    {selectedTicket.transferProof.notes}
                  </p>
                </div>
              )}
            </div>

            <DialogTitle className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mt-2">
              <div className="flex-1">
                <Button
                  variant="outline"
                  onClick={() => setImageModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cerrar
                </Button>
              </div>
              
              {selectedTicket.status === 'PENDING' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setImageModalOpen(false);
                      setShowRejectionDialog(true);
                    }}
                    className="flex-1 sm:flex-auto"
                  >
                    Rechazar
                  </Button>
                  
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-auto"
                    onClick={() => handleApprove(selectedTicket.id)}
                    disabled={processingTicketId === selectedTicket.id}
                  >
                    {processingTicketId === selectedTicket.id ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Aprobando...
                      </>
                    ) : (
                      'Aprobar'
                    )}
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para rechazar ticket */}
      {selectedTicket && showRejectionDialog && (
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent className="max-w-md">
            <DialogTitle>
              <DialogTitle>Rechazar transferencia</DialogTitle>
            </DialogTitle>
            
            <div className="space-y-4 py-2">
              <p>¿Estás seguro de rechazar esta transferencia?</p>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Motivo de rechazo (opcional)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué estás rechazando el pago..."
                  rows={3}
                />
              </div>
            </div>

            <DialogTitle className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1 sm:flex-initial"
              >
                Cancelar
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processingTicketId === selectedTicket.id}
                className="flex-1 sm:flex-initial"
              >
                {processingTicketId === selectedTicket.id ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Rechazando...
                  </>
                ) : (
                  'Confirmar rechazo'
                )}
              </Button>
            </DialogTitle>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}