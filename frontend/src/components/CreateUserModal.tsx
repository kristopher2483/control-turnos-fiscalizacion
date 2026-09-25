import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { useRolesQuery } from '../hooks/useRoles'
import { useCreateUser } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'

const createUserSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  fullName: z.string().min(1, 'Ingresa el nombre completo'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId: z.string().min(1, 'Selecciona un rol'),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

type CreateUserModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const rolesQuery = useRolesQuery()
  const createUserMutation = useCreateUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', fullName: '', email: '', password: '', roleId: '' },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ username: '', fullName: '', email: '', password: '', roleId: '' })
      createUserMutation.reset()
    }
  }, [isOpen])

  const onSubmit = handleSubmit((values: CreateUserFormValues) => {
    createUserMutation.mutate(
      {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        roleId: values.roleId,
      },
      { onSuccess: onClose },
    )
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo usuario"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-user-form" isLoading={createUserMutation.isPending}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre completo" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Usuario" error={errors.username?.message} {...register('username')} />
        <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
        <Select
          label="Rol"
          placeholder="Selecciona un rol"
          error={errors.roleId?.message}
          disabled={rolesQuery.isPending}
          {...register('roleId')}
        >
          {(rolesQuery.data ?? []).map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </Select>

        {createUserMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(createUserMutation.error)}</p>
        ) : null}
      </form>
    </Modal>
  )
}
