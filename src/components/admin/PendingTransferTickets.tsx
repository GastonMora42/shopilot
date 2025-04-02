// src/components/admin/PendingTransferTickets.tsx
import { useState, useEffect, SetStateAction } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { formatDate } from '@/app/lib/utils';
import Image from 'next/image';
import { X } from 'lucide-react';

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
}

export function PendingTransferTickets() {
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<PendingTicket | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tickets/pending');
      const data = await response.json();
      setPendingTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching pending tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (ticketId: string) => {
    try {
      setIsApproving(true);
      const response = await fetch('/api/tickets/approve-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId, 
          approve: true 
        })
      });

      if (!response.ok) throw new Error('Error al aprobar el ticket');
      await fetchPendingTickets();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsApproving(false);
      setSelectedTicket(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) return;
    
    try {
      setIsRejecting(true);
      const response = await fetch('/api/tickets/approve-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketId: selectedTicket.id, 
          approve: false,
          rejectionReason
        })
      });

      if (!response.ok) throw new Error('Error al rechazar el ticket');
      setShowRejectionDialog(false);
      setRejectionReason('');
      await fetchPendingTickets();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsRejecting(false);
      setSelectedTicket(null);
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({pendingTickets.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          {pendingTickets.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No hay tickets pendientes de aprobación
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingTickets.map((ticket) => (
                <Card key={ticket.id} className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-semibold">{ticket.eventName}</h3>
                      <p className="text-gray-600">{ticket.buyerName} - {ticket.buyerEmail}</p>
                      <p className="text-gray-600">
                        {ticket.seats ? `Asientos: ${ticket.seats.join(', ')}` : 
                         `${ticket.ticketType?.quantity}x ${ticket.ticketType?.name}`}
                      </p>
                      <p className="font-medium">${ticket.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Solicitud: {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <Button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setImageModalOpen(true);
                        }}
                      >
                        Ver comprobante
                      </Button>
                      
                      <Button
                        onClick={() => handleApprove(ticket.id)}
                        disabled={isApproving}
                      >
                        {isApproving ? 'Aprobando...' : 'Aprobar'}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowRejectionDialog(true);
                        }}
                        disabled={isRejecting}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>


{selectedTicket && (
  <Dialog.Root open={imageModalOpen} onOpenChange={setImageModalOpen}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md p-6 w-[90vw] max-w-md">
        <Dialog.Title className="text-lg font-bold">Comprobante de transferencia</Dialog.Title>
        
        <div className="space-y-4 mt-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <img
              src={selectedTicket.transferProof.imageUrl}
              alt="Comprobante"
              className="max-w-full rounded-lg"
            />
          </div>
          
          {selectedTicket.transferProof.notes && (
            <div>
              <h4 className="font-medium text-sm mb-1">Notas del comprador:</h4>
              <p className="text-gray-700 text-sm p-3 bg-gray-50 rounded-md">
                {selectedTicket.transferProof.notes}
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setImageModalOpen(false)}
            >
              Cerrar
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setImageModalOpen(false);
                  setShowRejectionDialog(true);
                }}
              >
                Rechazar
              </Button>
              
              <Button
                onClick={() => {
                  handleApprove(selectedTicket.id);
                  setImageModalOpen(false);
                }}
                disabled={isApproving}
              >
                {isApproving ? 'Aprobando...' : 'Aprobar'}
              </Button>
            </div>
          </div>
        </div>

        <Dialog.Close asChild>
          <button className="absolute top-4 right-4">
            <X size={16} />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)}

{selectedTicket && (
  <Dialog.Root open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md p-6 w-[90vw] max-w-md">
        <Dialog.Title className="text-lg font-bold">Rechazar transferencia</Dialog.Title>
        
        <div className="space-y-4 mt-4">
          <p>¿Estás seguro de rechazar esta transferencia?</p>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo de rechazo (opcional)
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e: { target: { value: SetStateAction<string>; }; }) => setRejectionReason(e.target.value)}
              placeholder="Explica por qué estás rechazando el pago..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectionDialog(false);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? 'Rechazando...' : 'Confirmar rechazo'}
            </Button>
          </div>
        </div>

        <Dialog.Close asChild>
          <button className="absolute top-4 right-4">
            <X size={16} />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)}
    </div>
  );
}