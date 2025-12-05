import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'FitsToGo - Virtual Try-On Marketplace',
  description:
    'Try on clothes virtually before you buy. Shop with confidence from Lazada and Shopee.',
  keywords: ['virtual try-on', 'online shopping', 'lazada', 'shopee', 'fashion'],
  openGraph: {
    title: 'FitsToGo - Virtual Try-On Marketplace',
    description: 'Try on clothes virtually before you buy.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
