import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getNavItemsForRole } from './navConfig'
import { SidebarNav } from './SidebarNav'
import { Badge } from '../ui/Badge'

const roleLabel: Record<'admin' | 'inspector', string> = {
  admin: 'Administrador',
  inspector: 'Inspector',
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">Gestión de Inspección</p>
        <p className="text-xs text-slate-500">Municipal</p>
      </div>
    </div>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  if (!user) return null

  const navItems = getNavItemsForRole(user.role.name)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
        <BrandMark />
        <div className="mt-8 flex-1">
          <SidebarNav items={navItems} />
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="truncate text-sm font-medium text-slate-800">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {isDrawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setIsDrawerOpen(false)} aria-hidden="true" />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white px-3 py-5 shadow-soft">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="mt-8 flex-1">
              <SidebarNav items={navItems} onNavigate={() => setIsDrawerOpen(false)} />
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          <div className="md:hidden">
            <BrandMark />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.fullName}</p>
            </div>
            <Badge tone={user.role.name === 'admin' ? 'indigo' : 'blue'}>{roleLabel[user.role.name]}</Badge>
            <button
              type="button"
              onClick={logout}
              aria-label="Cerrar sesión"
              className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:inline-flex"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              onClick={() => setIsDrawerOpen(false)}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-primary-700' : 'text-slate-500'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="h-16 md:hidden" aria-hidden="true" />
      </div>
    </div>
  )
}
