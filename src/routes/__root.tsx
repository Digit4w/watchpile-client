import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { type ReactNode, useEffect } from 'react'
import { gateDecision } from '@/domain/first-run-gate'
import { useCurrentUser } from '@/hooks/queries/auth/use-current-user'
import { useSetupStatus } from '@/hooks/queries/setup/use-setup-status'
import { queryClient } from '@/infra/lib/query-client'

export const Route = createRootRoute({
  component: RootComponent,
})

/**
 * O portão do primeiro uso.
 *
 * **Ele mora aqui e não numa rota porque a pergunta é do APP, não de uma tela.**
 * O argumento original era mecânico — `useRequireSession` cobre "tem sessão?" e
 * quatro rotas antigas ainda tinham a cópia à mão dela, que ficariam de fora.
 * Elas migraram em 04/09/2026 e o argumento **melhorou em vez de cair**:
 * `/login` e `/setup` de propósito não exigem sessão, e são justamente as duas
 * telas em que o portão precisa valer. `pending` é fato da instalação, e um
 * hook de sessão responde outra pergunta. Uma que vale em toda tela se responde
 * uma vez, acima de todas.
 *
 * **Ele SEGURA o render em vez de só redirecionar**, e isso é a lição de
 * "resposta definitiva não fica atrás de espera" lida ao contrário: aqui a
 * resposta ainda NÃO existe, e renderizar a Home de uma instalação não
 * configurada pra trocá-la no quadro seguinte é a piscada que a seção 11 já
 * recusou. Segurar custa uma consulta, que vai a um servidor local.
 *
 * `/setup` com nada pendente volta pra Home: o servidor recusa com 409 de
 * qualquer jeito, e uma tela alcançável que só sabe falhar é affordance
 * descrevendo o que não existe.
 */
function FirstRunGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const status = useSetupStatus()
  const currentUser = useCurrentUser()

  const decision = gateDecision({
    pending: status.data?.pending ?? null,
    pathname,
    statusPending: status.isPending,
    sessionPending: currentUser.isPending,
    signedIn: Boolean(currentUser.data),
  })

  // Extraído do objeto porque `decision` é novo a cada render: o efeito precisa
  // depender do destino, não da identidade da decisão.
  const redirectTo = decision.kind === 'redirect' ? decision.to : null

  useEffect(() => {
    if (redirectTo) {
      navigate({ to: redirectTo })
    }
  }, [redirectTo, navigate])

  /**
   * Sem esqueleto e sem limiar: isto não é uma tela esperando dado, é a decisão
   * de QUAL tela mostrar. Desenhar um esqueleto aqui prometeria a tela errada
   * durante a espera.
   */
  if (decision.kind !== 'render') {
    return <div className="min-h-svh bg-surface" />
  }

  return children
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <FirstRunGate>
          <Outlet />
        </FirstRunGate>
        {import.meta.env.DEV && (
          <>
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
          </>
        )}
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
