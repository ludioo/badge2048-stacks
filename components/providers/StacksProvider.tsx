'use client'

/**
 * Stacks Connect Provider Wrapper
 * 
 * Client component wrapper untuk Connect provider dari @stacks/connect-react
 * Diperlukan karena Connect menggunakan React Context yang hanya bisa di Client Components
 */

import { Connect } from '@stacks/connect-react';
import { appDetails, isTestnet } from '@/lib/stacks/config';

interface StacksProviderProps {
  children: React.ReactNode;
}

export function StacksProvider({ children }: StacksProviderProps) {
  return (
    <Connect 
      authOptions={{ 
        appDetails,
        redirectTo: typeof window !== 'undefined' ? window.location.origin : '/',
      }}
    >
      {children}
    </Connect>
  );
}
