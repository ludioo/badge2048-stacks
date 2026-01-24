import type { ReactNode } from 'react'
import type { BadgeTier } from '@/lib/game/types'

export type TierMeta = {
  label: string
  description: string
  accent: string
  background: string
  border: string
  softBackground: string
  icon: string
  button: string
  iconSvg: ReactNode
}

export const badgeTierMeta: Record<BadgeTier, TierMeta> = {
  bronze: {
    label: 'Bronze',
    description: 'First milestone achievement',
    accent: 'text-amber-900',
    background: 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300',
    border: 'border-amber-300',
    softBackground: 'bg-gradient-to-br from-amber-50 to-amber-100',
    icon: 'bg-amber-300 text-amber-900',
    button: 'bg-amber-700 text-white hover:bg-amber-600',
    iconSvg: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M8 12l-2 8 6-4 6 4-2-8" />
      </svg>
    ),
  },
  silver: {
    label: 'Silver',
    description: 'Intermediate achievement',
    accent: 'text-slate-800',
    background: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300',
    border: 'border-slate-300',
    softBackground: 'bg-gradient-to-br from-slate-50 to-slate-100',
    icon: 'bg-slate-300 text-slate-800',
    button: 'bg-slate-700 text-white hover:bg-slate-600',
    iconSvg: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l7 3v6c0 5-3 9-7 11-4-2-7-6-7-11V6l7-3z" />
      </svg>
    ),
  },
  gold: {
    label: 'Gold',
    description: 'Advanced achievement',
    accent: 'text-yellow-900',
    background: 'bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300',
    border: 'border-yellow-300',
    softBackground: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
    icon: 'bg-yellow-300 text-yellow-900',
    button: 'bg-yellow-600 text-white hover:bg-yellow-500',
    iconSvg: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8l4 3 5-6 5 6 4-3v9H3z" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  elite: {
    label: 'Elite',
    description: 'Expert level achievement',
    accent: 'text-purple-900',
    background: 'bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300',
    border: 'border-purple-300',
    softBackground: 'bg-gradient-to-br from-purple-50 to-purple-100',
    icon: 'bg-purple-300 text-purple-900',
    button: 'bg-purple-700 text-white hover:bg-purple-600',
    iconSvg: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9z" />
      </svg>
    ),
  },
}
