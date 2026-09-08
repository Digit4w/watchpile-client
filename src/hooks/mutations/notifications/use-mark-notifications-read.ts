import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from '@/hooks/queries/notifications/keys'
import type { HttpError } from '@/infra/lib/http-client'
import {
  type NotificationUnread,
  notificationsService,
} from '@/services/notifications'

/**
 * Marca como lido o que o painel MOSTROU, ao FECHAR.
 *
 * **Não durante a leitura** (design system, seção 5): apagar os pontos sob o
 * olho de quem está lendo é "a lista não se reordena sob a mão" aplicada ao
 * rastro — o que some é justamente a marca de onde a pessoa parou.
 *
 * **Sem escrita otimista**, ao contrário do toggle de preferências, e a
 * diferença é o gesto: lá o controle anuncia efeito imediato e a pessoa está
 * olhando pra ele; aqui a escrita acontece depois de o painel fechar, e ninguém
 * está olhando pro que ela muda. O servidor devolve o contador já recalculado, e
 * é ele que vale.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation<NotificationUnread, HttpError, number[]>({
    mutationFn: (ids) => notificationsService.markRead(ids),
    onSuccess: (unread) => {
      queryClient.setQueryData(notificationKeys.unread(), unread)
      // A lista precisa refazer: `read` mudou em várias linhas de uma vez, e
      // remendar cada uma seria a segunda conta do que a resposta já resolveu.
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
