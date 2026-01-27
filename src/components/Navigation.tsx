'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/getraenke', label: 'Getränke', icon: '🍺' },
  { href: '/inventur', label: 'Inventur', icon: '📋' },
  { href: '/helfer', label: 'Helfer', icon: '👥' },
  { href: '/teilnehmer', label: 'Teilnehmer', icon: '🎯' },
  { href: '/aufgaben', label: 'Aufgaben', icon: '✅' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🎉</span>
              <span className="font-bold text-xl text-gray-900">DJK Fest 70 Jahre</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
