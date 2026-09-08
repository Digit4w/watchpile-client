import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type FormEvent, useState } from 'react'
import { BrandMark, PanelShell } from '@/components/chrome/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/hooks/mutations/auth/use-login'
import { useCreateAdmin } from '@/hooks/mutations/setup/use-create-admin'
import { useSetupStatus } from '@/hooks/queries/setup/use-setup-status'
import { loginCopy } from './-login.copy'

export const Route = createFileRoute('/login')({
  component: LoginRoute,
})

function LoginRoute() {
  const navigate = useNavigate()
  const statusQuery = useSetupStatus()
  const createAdmin = useCreateAdmin()
  const login = useLogin()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (statusQuery.isPending) {
    return (
      <PanelShell>
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-md bg-raised" />
          <div className="h-5 w-40 animate-pulse rounded-md bg-raised" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-raised" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-16 animate-pulse rounded-sm bg-raised" />
            <div className="h-9 w-full animate-pulse rounded-md bg-raised" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-16 animate-pulse rounded-sm bg-raised" />
            <div className="h-9 w-full animate-pulse rounded-md bg-raised" />
          </div>
          <div className="mt-2 h-9 animate-pulse rounded-md bg-raised" />
        </div>
      </PanelShell>
    )
  }

  /**
   * **Só `'account'` põe esta tela em modo de criação.** Ela lia
   * `setupRequired`, um booleano que só sabia dizer "falta criar o admin"; com
   * o passo de instância existindo, `pending` pode ser `'instance'` — e aí o
   * lugar não é aqui, é `/setup`. Quem manda pra lá é o portão do `__root`,
   * porque a resposta vale em toda tela e não só nesta.
   */
  const isSetup = statusQuery.data?.pending === 'account'
  const copy = isSetup ? loginCopy.setup : loginCopy.login
  const mutation = isSetup ? createAdmin : login

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate(
      { username, password },
      {
        /**
         * Criar o admin leva DIRETO pro wizard, sem passar pela Home. O portão
         * do `__root` chegaria à mesma conclusão, mas um quadro depois — e o
         * que aparece nesse quadro é a Home de uma instalação que ainda não foi
         * configurada.
         */
        onSuccess: () => navigate({ to: isSetup ? '/setup' : '/' }),
      },
    )
  }

  return (
    <PanelShell>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <div>
          <h1 className="font-semibold text-lg">{copy.title}</h1>
          <p className="mt-1 text-muted text-sm">{copy.subtitle}</p>
        </div>
      </div>

      {mutation.error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-danger text-sm">
          {mutation.error.status === 401
            ? loginCopy.errors.invalidCredentials
            : loginCopy.errors.generic}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="font-medium text-muted text-sm">
            {loginCopy.fields.username}
          </label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-medium text-muted text-sm">
            {loginCopy.fields.password}
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            required
            minLength={isSetup ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {isSetup && (
            <p className="text-faint text-xs">{loginCopy.setup.passwordHint}</p>
          )}
        </div>
        <Button type="submit" className="mt-2" disabled={mutation.isPending}>
          {copy.submit}
        </Button>
      </form>
    </PanelShell>
  )
}
