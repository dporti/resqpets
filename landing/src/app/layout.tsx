import type { Metadata } from 'next';
import { Instrument_Serif, DM_Sans } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ResQPet — El CRM para protectoras de animales',
  description:
    'Gestiona animales, acogidas, adopciones y voluntarios con inteligencia artificial. Gratis para empezar.',
  keywords: 'CRM protectoras, gestión animales, software adopciones, refugio animales, IA',
  openGraph: {
    title: 'ResQPet — El CRM para protectoras de animales',
    description:
      'Gestiona animales, acogidas, adopciones y voluntarios con inteligencia artificial. Gratis para empezar.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'ResQPet',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResQPet — El CRM para protectoras de animales',
    description: 'Gestiona animales, acogidas, adopciones y voluntarios con IA.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="antialiased bg-[#0a0a0a] text-white overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
