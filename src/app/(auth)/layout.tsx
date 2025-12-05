import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-4">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">FitsToGo</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
