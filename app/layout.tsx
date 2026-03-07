import type { Metadata } from 'next';
import { ThemeProvider } from './_components/ThemeProvider';
import AppShell from './_components/AppShell';
import { ToasterProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarberPro',
  description: 'BarberPro frontend migrated to Next.js preserving existing business logic.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <ToasterProvider>
            <AppShell>{children}</AppShell>
          </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
