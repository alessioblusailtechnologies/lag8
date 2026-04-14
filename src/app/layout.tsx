import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.scss';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'lag8.ai',
  description: 'CRM verticale per procacciatori',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
