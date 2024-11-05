// middleware.ts (en la raíz del proyecto, al mismo nivel que package.json)
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Si está autenticado y está en la landing, redirigir al dashboard
    if (req.nextauth.token && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Proteger rutas del dashboard
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/', '/admin/:path*']
}