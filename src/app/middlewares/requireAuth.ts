// middleware/requireAuth.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function requireAuth(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return token
}