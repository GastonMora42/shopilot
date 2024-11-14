import { motion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import { memo } from "react";

// components/events/EventHeader.tsx
export const EventHeader = memo(({ name }: { name: string }) => (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900"
        >
          {name}
        </motion.h1>
      </div>
    </header>
  ));
  
  // components/events/EventDetails.tsx
  export const EventDetails = memo(({ date, location }: { date: string, location: string }) => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-gray-500">
        <Calendar className="h-5 w-5" />
        <span>{new Date(date).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</span>
        <Clock className="h-5 w-5 ml-4" />
        <span>{new Date(date).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>
      <div className="flex items-center space-x-2 text-gray-500">
        <MapPin className="h-5 w-5" />
        <span>{location}</span>
      </div>
    </div>
  ));
  
