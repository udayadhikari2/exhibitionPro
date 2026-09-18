import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Digital Exhibition & Competition Portal',
  description:
    'Modern, event-driven web application for school and college exhibitions and competitions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-slate-50 text-slate-900 font-sans">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Digital Exhibition & Competition Portal &bull; Phase 0 Foundation
              </div>
              <div className="flex gap-3 text-slate-400">
                <span>Clean Architecture</span>
                <span>&bull;</span>
                <span>Modular UI System</span>
                <span>&bull;</span>
                <span>Event-Driven</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
