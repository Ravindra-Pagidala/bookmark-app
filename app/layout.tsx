import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartMark — Bookmark Manager',
  description: 'A fast, private bookmark manager with real-time sync',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  );
}