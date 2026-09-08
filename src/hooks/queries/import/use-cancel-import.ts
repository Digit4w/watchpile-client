import { useMutation, useQueryClient } from '@tanstack/react-query'
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
 */
export function useCancelImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => importService.cancel(id),
    onSuccess: (job) => {
      // Mescla, como o start: `sources` é do estado anterior e não vem aqui.
      queryClient.setQueryData(importKeys.status(), (old: unknown) => ({
        ...(old as object),
        running: job,
        mine: true,
        latest: job,
      }))
    },
  })
}
