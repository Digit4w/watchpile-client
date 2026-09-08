import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from '@/hooks/queries/notifications/keys'
import type { HttpError } from '@/infra/lib/http-client'
import { notificationsService } from '@/services/notifications'

/**
 * Dispensar tira do painel e MANTÉM no histórico.
 *
 * A escrita muda a **composição** da lista aberta — um item sai —, e pela régua
 * de 30/08 isso refaz a lista em vez de remendar o item no lugar. Invalidar é o
 * jeito honesto de dizer isso: o painel perde uma linha, o histórico ganha uma
 * dispensada, e o contador muda se ela estava por ler.
 */
export function useDismissNotification() {
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, HttpError, number>({
    mutationFn: (id) => notificationsService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
