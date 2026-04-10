'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SUBNAV_ITEMS = [
  { href: '/waren', label: 'Katalog', exact: true },
  { href: '/waren/inventur', label: 'Inventur' },
  { href: '/waren/verkauf', label: 'Verkauf' },
]

export default function WarenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="-m-4 lg:-m-6">
      {/* Header */}
      <div className="bg-gray-900 px-4 pt-12 lg:pt-6 pb-4">
        <p className="text-yellow-500 text-xs font-semibold tracking-widest uppercase">DJK Ottenhofen e.V.</p>
        <h1 className="text-2xl font-bold text-white">Warenwirtschaft</h1>
      </div>

      {/* Sub-Navigation (sticky) */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2">
        <div className="flex gap-1 max-w-2xl mx-auto">
          {SUBNAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold text-center transition-all ${
                isActive(item.href, item.exact)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  )
}
