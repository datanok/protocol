'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <button 
      onClick={handleSignOut}
      className="text-xs text-red-500 hover:text-red-400 transition-colors font-mono tracking-wide text-left mt-2 pt-2 border-t border-[#242424]"
    >
      › Terminate Session
    </button>
  );
}
