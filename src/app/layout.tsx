import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/hooks/use-auth';
import { DocumentProvider } from '@/contexts/document-context';

export const metadata: Metadata = {
  title: 'Freedom AI Analysis - Продвинутая платформа для анализа данных',
  description: 'Опыт беспрепятственного анализа данных с продвинутыми функциями, аналитикой в реальном времени и безопасностью институционального уровня.',
  icons: {
    icon: ['/favicon.ico', '/logo.png'],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        <AuthProvider>
          <DocumentProvider>
            {children}
            <Toaster />
          </DocumentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
