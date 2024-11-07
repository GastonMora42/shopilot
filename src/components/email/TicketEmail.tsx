// components/emails/TicketEmail.tsx
'use client';

import {
  Html,
  Text,
  Section,
  Container,
} from '@react-email/components';

interface TicketEmailProps {
  ticket: {
    eventName: string;
    date: string;
    location: string;
    seats: string[];
  };
  qrUrl: string;
}

const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: 'arial',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '26px',
  },
  ticketInfo: {
    padding: '24px',
    border: '1px solid #e6e6e6',
    borderRadius: '5px',
    margin: '20px 0',
  },
  eventName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 16px',
  },
  qrContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  footer: {
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center' as const,
    margin: '16px 0 0',
  },
};

export function TicketEmail({ ticket, qrUrl }: TicketEmailProps) {
  return (
    <Html>
      <Section style={styles.main}>
        <Container style={styles.container}>
          <Text style={styles.heading}>¡Tu entrada está lista!</Text>
          <Text style={styles.paragraph}>
            Gracias por tu compra. Aquí están los detalles de tu entrada:
          </Text>
          
          <Section style={styles.ticketInfo}>
            <Text style={styles.eventName}>{ticket.eventName}</Text>
            <Text>Fecha: {new Date(ticket.date).toLocaleString()}</Text>
            <Text>Ubicación: {ticket.location}</Text>
            <Text>Asientos: {ticket.seats.join(', ')}</Text>
          </Section>

          <Section style={styles.qrContainer}>
            <img src={qrUrl} width={200} height={200} alt="QR Code" />
          </Section>

          <Text style={styles.footer}>
            Presenta este código QR en la entrada del evento
          </Text>
        </Container>
      </Section>
    </Html>
  );
}