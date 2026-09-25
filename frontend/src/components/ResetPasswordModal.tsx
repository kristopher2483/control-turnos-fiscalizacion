import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useResetUserPassword } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'
import type { User } from '../types'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

type ResetPasswordModalProps = {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
  const resetPasswordMutation = useResetUserPassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ newPassword: '' })
      resetPasswordMutation.reset()
    }
  }, [isOpen])

  if (!user) return null

  const onSubmit = handleSubmit((values) => {
    resetPasswordMutation.mutate({ id: user.id, newPassword: values.newPassword }, { onSuccess: onClose })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Restablecer contraseña · ${user.username}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" isLoading={resetPasswordMutation.isPending}>
            Restablecer
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Define una nueva contraseña temporal para <span className="font-medium text-slate-700">{user.fullName}</span>.
        </p>
        <Input label="Nueva contraseña" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        {resetPasswordMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(resetPasswordMutation.error)}</p>
        ) : null}
        {resetPasswordMutation.isSuccess ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Contraseña actualizada correctamente.</p>
        ) : null}
      </form>
    </Modal>
  )
}
