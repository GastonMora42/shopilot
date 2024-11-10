// components/email/TicketEmail.tsx
import { 
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Preview
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

export function TicketEmail({ ticket, qrUrl }: TicketEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu entrada para {ticket.eventName}</Preview>
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Section>
            <Text>¡Gracias por tu compra!</Text>
            <Text>Aquí están los detalles de tu entrada:</Text>
          </Section>

          <Section style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
            <Text><strong>Evento:</strong> {ticket.eventName}</Text>
            <Text><strong>Fecha:</strong> {new Date(ticket.date).toLocaleString()}</Text>
            <Text><strong>Ubicación:</strong> {ticket.location}</Text>
            <Text><strong>Asientos:</strong> {ticket.seats.join(', ')}</Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '20px' }}>
            <Text>Tu código QR:</Text>
            <Img 
              src={qrUrl} 
              width="200" 
              height="200" 
              alt="Código QR del ticket"
              style={{ margin: '0 auto' }}
            />
          </Section>

          <Section style={{ marginTop: '20px' }}>
            <Text>Presenta este código QR en la entrada del evento.</Text>
            <Text>También puedes descargar tu entrada desde el sitio web.</Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link 
              href="https://www.shopilot.xyz/tickets"
              style={{ 
                backgroundColor: '#000',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '5px',
                textDecoration: 'none'
              }}
            >
              Ver mis tickets
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}