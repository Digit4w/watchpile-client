import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ImportJob, ImportStatus } from '@/services/import'
import { importService } from '@/services/import'
import { importKeys } from './keys'

/**
 * `Stop`.
 *
 * **Pede, não desliga** — o servidor grava o pedido e o laço obedece no fim do
 * lote. Por isso a resposta ainda vem com `status: 'running'`, e a tela não
 * pode tratá-la como "parou": o que muda é `cancelRequestedAt`, e é dele que o
 * botão vira "Stopping…".
 *
 * Escreve a resposta no cache pelo mesmo motivo do start: o poll de dois
 * segundos deixaria o botão sem reação por um ciclo depois do clique.
 *
 * ── E ela escreve no campo do KIND certo — 13/09/2026 ──────────────────────
 * Ela nasceu quando `import_jobs` só guardava importações, então mandava a
 * resposta para `running` e `latest` sem perguntar que trabalho era. Com três
 * tipos vivos, cancelar a VARREDURA punha o job dela em `running` (onde a tela
 * espera um import) e em `latest` (o bloco de resultado), e o resultado do
 * último import **sumia da tela**.
 *
 * É a régua de 09/09 aplicada a um campo em vez de a uma chave: *descoberta a
 * assimetria, procurar quem mais escreve ali*. Aqui quem escrevia era uma
 * mutação que tinha razão até o dia em que o vocabulário cresceu.
 */
export function useCancelImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => importService.cancel(id),
    onSuccess: (job: ImportJob) => {
      // Mescla, como o start: `sources` é do estado anterior e não vem aqui.
      queryClient.setQueryData(importKeys.status(), (old: unknown) => {
        const before = old as ImportStatus

        if (job.kind === 'import') {
          return { ...before, running: job, mine: true, latest: job }
        }

        /**
         * Aquecimento e varredura têm cada um o seu campo, e **nenhum dos dois
         * toca `latest`**: aquele bloco é o resultado do último IMPORT, e é o
         * que a pessoa veio conferir.
         */
        return job.kind === 'enrich'
          ? { ...before, enriching: job }
          : { ...before, refreshing: job }
      })
    },
  })
}
