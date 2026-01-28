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
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    )
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            badge2048
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex gap-2">
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
            <WalletConnect />
          </div>
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100"
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
        <div
          id="mobile-navigation"
          className={cn(
            'md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-out',
            isOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
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
            <div className="pt-2 border-t border-gray-200">
              <div className="px-1">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
