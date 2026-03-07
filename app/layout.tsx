import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './_components/ThemeProvider';
import AppShell from './_components/AppShell';
import { ToasterProvider } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BarberPro',
  description: 'BarberPro frontend migrated to Next.js preserving existing business logic.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <ToasterProvider>
            <AppShell>{children}</AppShell>
          </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
