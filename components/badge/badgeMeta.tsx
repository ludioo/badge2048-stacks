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
    accent: 'text-[#F4622F]',
    background: 'bg-gradient-to-br from-[#FD9E7F] via-[#FB6331] to-[#F4622F]',
    border: 'border-[#FB6331]',
    softBackground: 'bg-gradient-to-br from-white to-[#FD9E7F]',
    icon: 'bg-[#FD9E7F] text-[#F4622F]',
    button: 'bg-[#F4622F] text-white hover:bg-[#FB6331]',
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
    accent: 'text-[#E8552A]',
    background: 'bg-gradient-to-br from-[#FB6331] via-[#F4622F] to-[#E8552A]',
    border: 'border-[#F4622F]',
    softBackground: 'bg-gradient-to-br from-[#FD9E7F] to-[#FB6331]',
    icon: 'bg-[#FB6331] text-white',
    button: 'bg-[#E8552A] text-white hover:bg-[#F4622F]',
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
    accent: 'text-[#DC4824]',
    background: 'bg-gradient-to-br from-[#F4622F] via-[#E8552A] to-[#DC4824]',
    border: 'border-[#E8552A]',
    softBackground: 'bg-gradient-to-br from-[#FB6331] to-[#F4622F]',
    icon: 'bg-[#F4622F] text-white',
    button: 'bg-[#DC4824] text-white hover:bg-[#E8552A]',
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
    accent: 'text-[#C42E18]',
    background: 'bg-gradient-to-br from-[#E8552A] via-[#DC4824] to-[#C42E18]',
    border: 'border-[#DC4824]',
    softBackground: 'bg-gradient-to-br from-[#F4622F] to-[#E8552A]',
    icon: 'bg-[#E8552A] text-white',
    button: 'bg-[#C42E18] text-white hover:bg-[#DC4824]',
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
