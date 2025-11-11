import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Performance Dashboard - Real-time Data Visualization',
  description: 'High-performance dashboard for visualizing 10,000+ data points at 60fps using Next.js 14 and TypeScript.',
  keywords: ['dashboard', 'performance', 'data visualization', 'real-time', 'next.js', 'typescript'],
  authors: [{ name: 'Performance Dashboard Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gray-50 antialiased">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}