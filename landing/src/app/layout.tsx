import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'ResQPet — El CRM para protectoras de animales',
  description:
    'Gestiona animales, acogidas, adopciones y voluntarios con inteligencia artificial. Gratis para empezar.',
  keywords: 'CRM protectoras, gestión animales, software adopciones, gestión refugio animales',
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
    description: 'Gestiona animales, acogidas, adopciones y voluntarios con IA. Gratis para empezar.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased text-gray-900 bg-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
