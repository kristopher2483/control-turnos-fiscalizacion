import type { ReactNode } from 'react'
import type { Role } from '../../types'

export type NavItem = {
  key: string
  label: string
  to: string
  roles: Array<Role['name']>
  icon: ReactNode
  end?: boolean
}

const iconClass = 'h-5 w-5'

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'mi-ruta',
    label: 'Mi ruta',
    to: '/mi-ruta',
    roles: ['inspector'],
    end: true,
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    label: 'Panel',
    to: '/admin',
    roles: ['admin'],
    end: true,
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5h6v-9H3v9zM3 21h6v-4.5H3V21zm12 0h6V10.5h-6V21zm0-18v4.5h6V3h-6z" />
      </svg>
    ),
  },
  {
    key: 'usuarios',
    label: 'Usuarios',
    to: '/admin/usuarios',
    roles: ['admin'],
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'catalogo',
    label: 'Catálogo',
    to: '/admin/catalogo',
    roles: ['admin'],
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h11.25M9 9.75h11.25M9 15h11.25M9 20.25h11.25M3.75 4.5h.008v.008H3.75V4.5zm0 5.25h.008v.008H3.75V9.75zm0 5.25h.008v.008H3.75V15zm0 5.25h.008v.008H3.75v-.008z" />
      </svg>
    ),
  },
  {
    key: 'registros',
    label: 'Registros',
    to: '/admin/registros',
    roles: ['admin'],
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-9 5h12a2 2 0 002-2V6.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0015.586 2H6a2 2 0 00-2 2v15a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export function getNavItemsForRole(role: Role['name']): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
