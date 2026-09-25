import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const user = await login(values.username, values.password)
    navigate(user.role.name === 'admin' ? '/admin' : '/mi-ruta', { replace: true })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Gestión de Inspección Municipal</h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <Input
              label="Usuario"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {loginError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{loginError}</p> : null}

            <Button type="submit" isLoading={isLoggingIn} fullWidth size="lg">
              Ingresar
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Credenciales de demostración</p>
            <p className="mt-1">
              Administrador: <span className="font-mono text-slate-700">admin / Admin123!</span>
            </p>
            <p>
              Inspector: <span className="font-mono text-slate-700">inspector1 / Inspector123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
