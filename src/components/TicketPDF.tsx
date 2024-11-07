// components/TicketPDF.tsx
'use client';

import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  qr: {
    marginTop: 20,
    alignItems: 'center',
  },
  qrImage: {
    width: 150,
    height: 150,
  }
});

type TicketPDFProps = {
  ticket: {
    eventName: string;
    date: string;
    location: string;
    seats: string[];
    qrCode: string;
    buyerInfo: {
      name: string;
      email: string;
    };
  };
};

export function TicketPDF({ ticket }: TicketPDFProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(ticket.qrCode);
        setQrImageUrl(url);
      } catch (err) {
        console.error('Error generando QR:', err);
      }
    };

    generateQR();
  }, [ticket.qrCode]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{ticket.eventName}</Text>
          <Text style={styles.text}>Fecha: {new Date(ticket.date).toLocaleString()}</Text>
          <Text style={styles.text}>Ubicación: {ticket.location}</Text>
          <Text style={styles.text}>Asientos: {ticket.seats.join(', ')}</Text>
          <Text style={styles.text}>Comprador: {ticket.buyerInfo.name}</Text>
          {qrImageUrl && (
            <View style={styles.qr}>
              <Image src={qrImageUrl} style={styles.qrImage} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}