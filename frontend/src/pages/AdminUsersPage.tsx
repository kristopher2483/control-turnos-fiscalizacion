import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { CreateUserModal } from '../components/CreateUserModal'
import { EditUserModal } from '../components/EditUserModal'
import { ResetPasswordModal } from '../components/ResetPasswordModal'
import { useUsersQuery } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'
import type { User } from '../types'

export function AdminUsersPage() {
  const usersQuery = useUsersQuery()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resettingUser, setResettingUser] = useState<User | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuarios</h1>
          <p className="mt-0.5 text-sm text-slate-500">Administra inspectores y administradores del sistema.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Nuevo usuario</Button>
      </div>

      {usersQuery.isPending ? (
        <Spinner />
      ) : usersQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(usersQuery.error)}</p>
      ) : (usersQuery.data ?? []).length === 0 ? (
        <EmptyState title="No hay usuarios registrados" description="Crea el primer usuario para comenzar." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(usersQuery.data ?? []).map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{user.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{user.username}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role.name === 'admin' ? 'indigo' : 'blue'}>{user.role.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.active ? 'green' : 'gray'} dot>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setResettingUser(user)}>
                          Restablecer contraseña
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <EditUserModal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} user={editingUser} />
      <ResetPasswordModal isOpen={Boolean(resettingUser)} onClose={() => setResettingUser(null)} user={resettingUser} />
    </div>
  )
}
