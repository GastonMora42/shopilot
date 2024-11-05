// pages/api/seats/create-bulk.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Seat } from '@/app/models/Seat';
import  dbConnect  from '@/app/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { seats } = req.body;
    
    const createdSeats = await Seat.insertMany(seats);
    
    return res.status(200).json({ success: true, seats: createdSeats });
  } catch (error) {
    console.error('Error creating seats:', error);
    return res.status(500).json({ error: 'Error creating seats' });
  }
}