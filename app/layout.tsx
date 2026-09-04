import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const display = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600', '700'] })
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Forno Panevero | Pane artigianale a Catania',
  description: 'Pane, focacce e dolci artigianali. Prenota il tuo ritiro al Forno Panevero.',
  generator: 'PaneHub',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7f1e8' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it" className="bg-[#f7f1e8]"><body className={`${display.variable} ${body.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
