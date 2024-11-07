// app/(dashboard)/admin/tickets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/app/lib/utils';

interface TicketSummary {
  eventId: string;
  eventName: string;
  totalTickets: number;
  usedTickets: number;
  pendingTickets: number;
  totalRevenue: number;
}

export default function TicketsPage() {
  const [ticketSummaries, setTicketSummaries] = useState<TicketSummary[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketSummaries();
  }, []);

  const fetchTicketSummaries = async () => {
    try {
      const response = await fetch('/api/tickets/summary');
      const data = await response.json();
      setTicketSummaries(data.summaries);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resumen de Tickets</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Vendidos</h3>
          <p className="text-2xl font-bold">
            {ticketSummaries.reduce((sum, event) => sum + event.totalTickets, 0)}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Recaudado</h3>
          <p className="text-2xl font-bold">
            {formatCurrency(
              ticketSummaries.reduce((sum, event) => sum + event.totalRevenue, 0)
            )}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Tickets Usados</h3>
          <p className="text-2xl font-bold">
            {ticketSummaries.reduce((sum, event) => sum + event.usedTickets, 0)}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead className="text-right">Tickets Vendidos</TableHead>
              <TableHead className="text-right">Tickets Usados</TableHead>
              <TableHead className="text-right">Pendientes</TableHead>
              <TableHead className="text-right">Recaudación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticketSummaries.map((summary) => (
              <TableRow key={summary.eventId}>
                <TableCell className="font-medium">
                  {summary.eventName}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">
                    {summary.totalTickets}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="success">
                    {summary.usedTickets}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">
                    {summary.pendingTickets}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(summary.totalRevenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}