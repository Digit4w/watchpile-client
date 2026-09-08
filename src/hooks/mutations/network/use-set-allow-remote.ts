import { useMutation, useQueryClient } from '@tanstack/react-query'
import { networkKeys } from '@/hooks/queries/network/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { type NetworkSettings, networkService } from '@/services/network'

/**
 * Liga e desliga conexões remotas.
 *
 * **Escreve a resposta no cache em vez de invalidar** — ela já é o estado
 * inteiro e novo, `restartPending` incluído. Invalidar pediria a mesma coisa de
 * volta ao servidor e deixaria a linha oscilando entre o valor antigo e o novo
 * no meio do gesto, que é a régua de "a lista não se reordena sob a mão"
 * aplicada a um controle só.
 */
export function useSetAllowRemote() {
  const queryClient = useQueryClient()

  return useMutation<NetworkSettings, HttpError, boolean>({
    mutationFn: networkService.setAllowRemote,
    onSuccess: (next) => {
      queryClient.setQueryData(networkKeys.all, next)
    },
  })
}
