import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { appCopy } from '@/lib/copy'
import './route-progress.css'

/**
 * A faixa de carregando da troca de rota — 15/09/2026, decisão do dono.
 *
 * **Por que existe.** O TanStack Router escreve a URL no clique e só troca a
 * árvore quando o chunk da rota chega. Enquanto isso a sidebar já acende o
 * destino novo e a tela segue na antiga, sem nada dizendo que algo está a
 * caminho — foi o bug de 14/09 (HANDOFF), em que a espera chegava a 30 s atrás
 * das imagens. A fila de arte (`lib/art-gate.ts`) tirou a causa daquela
 * espera; esta faixa é o que impede qualquer espera futura de parecer
 * congelamento.
 *
 * **A tela anterior fica, e a faixa só ocupa a borda.** Trocar a tela por um
 * esqueleto exigiria o `AppShell` fora das rotas, e trocá-la por uma espera
 * cheia tiraria a sidebar da tela a cada clique (ver `RouterProgress`, no
 * `__root`).
 *
 * **O limiar é o do app** (`useDelayedPending`: 200 ms para aparecer, 300 ms
 * de permanência), porque a navegação típica termina em dezenas de
 * milissegundos e uma faixa a cada clique seria ruído.
 *
 * **Barra, e é a SEGUNDA exceção à regra do progresso** (design system, seção
 * 2): não mede trabalho — não há denominador nem numerador —, só diz que a
 * tela está a caminho. Por isso é indeterminada e não carrega `aria-valuenow`,
 * como a barra de download de `Updates` sem `Content-Length`. **`bg-ink`, não
 * accent**: o chrome é neutro, e o accent é feedback pontual de um gesto, não
 * estado da aplicação.
 */
export function RouteProgress({ pending }: { pending: boolean }) {
  const visible = useDelayedPending(pending)

  if (!visible) {
    return null
  }

  return (
    <div
      role="progressbar"
      aria-label={appCopy.nav.loading}
      className="wp-route-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-ink"
    />
  )
}
