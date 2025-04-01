'use client'

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    setTimeout(() => {
      logout();
    }, 1500);
  }, []);

  return (
    <div className="flex h-full w-full flex-col place-content-center items-center space-y-4">
      <h1 className="text-5xl after:inline-block after:w-0 after:animate-ellipsis after:overflow-hidden after:align-bottom after:content-['\2026']">
        Logging out
      </h1>

      <div className="flex space-x-4">
        <Image src="/pacman_cyan_ghost.gif" alt="Cyan pacman ghost" width={64} height={64} />
        <Image src="/pacman_pink_ghost.gif" alt="Pink pacman ghost" width={64} height={64} />
        <Image src="/pacman_red_ghost.gif" alt="Red pacman ghost" width={64} height={64} />
        <Image src="/pacman_yellow_ghost.gif" alt="Yellow pacman ghost" width={64} height={64} />
      </div>
    </div>
  );
}
