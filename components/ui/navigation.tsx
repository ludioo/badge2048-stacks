'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WalletConnect } from './wallet-connect'

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/play', label: 'Play' },
    { href: '/badges', label: 'Badges' },
    { href: '/claim', label: 'Claim' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  const getLinkClassName = (href: string) => {
    const isActive = pathname === href
    return cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center md:min-h-0',
      isActive
        ? 'bg-[#F4622F] text-white'
        : 'text-[#4B5563] hover:bg-[#FD9E7F]/10 hover:text-[#F4622F]'
    )
  }

  return (
    <nav className="w-full border-b border-[#FD9E7F]/30 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 min-w-0 min-h-[56px] sm:min-h-[60px] py-3">
          <Link href="/" className="text-lg sm:text-xl font-bold text-[#F4622F] shrink-0 leading-tight flex items-center">
            badge2048-stacks
          </Link>
          {/* Desktop: nav links + wallet in bar. Mobile: only hamburger — wallet lives inside menu */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 justify-end">
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={getLinkClassName(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <WalletConnect />
            </div>
            <button
              type="button"
              className="md:hidden shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-md border border-[#FD9E7F] bg-white p-2 text-[#F4622F] hover:bg-[#FD9E7F]/10"
              aria-label="Toggle navigation menu"
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsOpen((value) => !value)}
            >
              <span className="sr-only">Toggle navigation</span>
              <div className="flex flex-col gap-1">
                <span className={cn('h-0.5 w-5 bg-current transition-transform', isOpen && 'translate-y-[5px] rotate-45')} />
                <span className={cn('h-0.5 w-5 bg-current transition-opacity', isOpen && 'opacity-0')} />
                <span className={cn('h-0.5 w-5 bg-current transition-transform', isOpen && '-translate-y-[5px] -rotate-45')} />
              </div>
            </button>
          </div>
        </div>
        <div
          id="mobile-navigation"
          className={cn(
            'md:hidden overflow-y-auto transition-[max-height,opacity] duration-200 ease-out',
            isOpen ? 'max-h-[min(28rem,85vh)] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="flex flex-col pb-4">
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={getLinkClassName(link.href)}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t border-[#FD9E7F]/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5563] mb-2 px-1">Wallet</p>
              <div className="w-full">
                <WalletConnect variant="menu" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
