// src/app/(dashboard)/admin/events/[id]/scanner/page.tsx
'use client';

import { QrScanner } from '@/components/QRScanner';

export default function ScannerPage() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scanner de Tickets</h1>
      <QrScanner />
    </div>
  );
}