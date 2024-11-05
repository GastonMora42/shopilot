// app/(public)/page.tsx
import Link from 'next/link';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { formatDate } from '@/app/lib/utils';
import { IEvent } from '@/types';

async function getEvents(): Promise<IEvent[]> {
  await dbConnect();
  const events = await Event.find({ published: true })
    .sort({ date: 1 })
    .lean();
  return events as unknown as IEvent[];
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Próximos Eventos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: IEvent) => (
          <Link 
            key={event._id.toString()} 
            href={`/e/${event.slug}`}
            className="block group"
          >
            <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
                  {event.name}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>📅 {formatDate(event.date)}</p>
                  <p>📍 {event.location}</p>
                  <p>💲 ${event.price}</p>
                  <p>🎟️ {event.availableSeats} asientos disponibles</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}