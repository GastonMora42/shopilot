// app/api/events/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import { Event } from '@/app/models/Event';
import { User } from '@/app/models/User'; 
import mongoose from 'mongoose';
import { creditCheck } from '@/app/middlewares/creditCheck';
import { CreditService } from '@/app/services/creditService';

export async function POST(
 _req: Request,
 { params }: { params: { id: string } }
) {
 let mongoSession = null;

 try {
   const session = await getServerSession(authOptions);
   if (!session?.user?.email) {
     return NextResponse.json(
       { error: 'No autorizado' },
       { status: 401 }
     );
   }

   await dbConnect();

   const event = await Event.findById(params.id);
   if (!event) {
     return NextResponse.json(
       { error: 'Evento no encontrado' },
       { status: 404 }
     );
   }

   // Validar que el evento tenga toda la información necesaria
   if (!event.name || !event.date || !event.location) {
     return NextResponse.json(
       { error: 'El evento no tiene toda la información necesaria' },
       { status: 400 }
     );
   }

   // Si se va a publicar el evento, verificar créditos
   if (!event.published) {
     const user = await User.findOne({ email: session.user.email });
     
     const creditCheckResult = await creditCheck(event, user._id.toString());
     if (creditCheckResult.error) {
       return NextResponse.json({ 
         error: creditCheckResult.message 
       }, { status: 400 });
     }

     // Iniciar transacción
     mongoSession = await mongoose.startSession();
     mongoSession.startTransaction();

     try {
       // Deducir créditos
       await CreditService.deductCredits(
         user._id.toString(),
         creditCheckResult.requiredCredits,
         event._id.toString()
       );

       // Actualizar estado del evento
       event.published = true;
       event.publishedAt = new Date();
       await event.save({ session: mongoSession });

       await mongoSession.commitTransaction();
     } catch (error) {
       await mongoSession.abortTransaction();
       throw error;
     }
   } else {
     // Si se está despublicando, no necesitamos verificar créditos
     event.published = false;
     event.publishedAt = null;
     await event.save();
   }

   return NextResponse.json({
     success: true,
     event
   });

 } catch (error) {
   console.error('Error:', error);
   return NextResponse.json(
     { error: 'Error al actualizar el evento' },
     { status: 500 }
   );
 } finally {
   if (mongoSession) {
     await mongoSession.endSession();
   }
 }
}