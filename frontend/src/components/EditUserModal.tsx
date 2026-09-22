import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Toggle } from './ui/Toggle'
import { useRolesQuery } from '../hooks/useRoles'
import { useUpdateUser } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'
import type { User } from '../types'

const editUserSchema = z.object({
  fullName: z.string().min(1, 'Ingresa el nombre completo'),
  email: z.string().email('Correo inválido'),
  roleId: z.string().min(1, 'Selecciona un rol'),
})

type EditUserFormValues = z.infer<typeof editUserSchema>

type EditUserModalProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const rolesQuery = useRolesQuery()
  const updateUserMutation = useUpdateUser()
  const [active, setActive] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { fullName: '', email: '', roleId: '' },
  })

  useEffect(() => {
    if (user) {
      reset({ fullName: user.fullName, email: user.email, roleId: user.roleId })
      setActive(user.active)
      updateUserMutation.reset()
    }
  }, [user])

  if (!user) return null

  const onSubmit = handleSubmit((values) => {
    updateUserMutation.mutate({ id: user.id, input: { ...values, active } }, { onSuccess: onClose })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar usuario · ${user.username}`}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-user-form" isLoading={updateUserMutation.isPending}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre completo" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
        <Select label="Rol" error={errors.roleId?.message} disabled={rolesQuery.isPending} {...register('roleId')}>
          {(rolesQuery.data ?? []).map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </Select>

        <div className="rounded-xl border border-slate-200 px-3.5 py-3">
          <Toggle checked={active} onChange={setActive} label={active ? 'Usuario activo' : 'Usuario desactivado'} />
          <p className="mt-1.5 text-xs text-slate-500">
            Desactivar un usuario le impide iniciar sesión. Es la única forma de dar de baja una cuenta: no es posible eliminar
            usuarios.
          </p>
        </div>

        {updateUserMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(updateUserMutation.error)}</p>
        ) : null}
      </form>
    </Modal>
  )
}
