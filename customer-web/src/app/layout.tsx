import './globals.css'
import type { Metadata } from 'next'
import Link from "next/link"
import { Providers } from "./providers"
import CartBadge from "./nav/CartBadge"

export const metadata: Metadata = {
  title: 'Igatpuri Food Delivery',
  description: 'Order food from local dhabas in Igatpuri',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold">Igatpuri Eats</Link>
              <div className="flex gap-4 items-center">
                <Link href="/cart" className="font-medium">
                  <CartBadge />
                </Link>
                <Link href="/track" className="text-white/90 hover:text-white text-sm font-medium">Track</Link>
              </div>
            </div>
          </nav>
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-dark text-white p-6 text-center mt-10">
            <p>&copy; 2026 Igatpuri Eats. All rights reserved.</p>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
