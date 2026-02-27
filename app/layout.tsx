import type { Metadata } from 'next';
import Script from 'next/script';
import { ThemeProvider } from './_components/ThemeProvider';
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`window.tailwind = window.tailwind || {}; window.tailwind.config = { theme: { extend: { colors: { primary: '#c69a45', 'primary-dark': '#a87a2f', background: '#090c14', surface: '#111624', borderc: '#28314a', 'text-primary': '#edf2ff', 'text-secondary': '#9da8c3' }, fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }, borderRadius: { xl: '1rem', '2xl': '1.25rem' }, boxShadow: { soft: '0 10px 30px rgba(0,0,0,0.24)' } } } };`}
        </Script>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
