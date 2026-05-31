'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/'];
// Routes accessible without authentication (prefix match)
const PUBLIC_PREFIXES = ['/templates', '/u/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.push('/login');
    } else if (!isLoading && user && pathname === '/login') {
      // If already logged in, don't let them stay on login page
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  // Wait until auth state is known
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-[#D4AF37]">
        <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-80" />
        <span className="font-mono text-[10px] tracking-widest uppercase">Authenticating Connection...</span>
      </div>
    );
  }

  // If not logged in and on a private route, render nothing while redirecting
  if (!user && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
