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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B6E64] via-[#136B57] to-[#2B6B33] px-4 py-10">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#C3D82C]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#D91E8C]/25 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg shadow-black/20 backdrop-blur">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">Gestión de Inspección Municipal</h1>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h2>
          <p className="mt-1.5 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5" noValidate>
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

            <Button type="submit" variant="accent" isLoading={isLoggingIn} fullWidth size="lg" className="mt-1">
              Ingresar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} · Plataforma interna de fiscalización municipal
        </p>
      </div>
    </div>
  )
}
