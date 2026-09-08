import { useInfiniteQuery } from '@tanstack/react-query'
import {
  type NotificationAudience,
  type NotificationInclude,
  notificationsService,
} from '@/services/notifications'
import { notificationKeys } from './keys'

/**
 * A lista, paginada por cursor.
 *
 * **Infinita e não paginada em páginas numeradas**: o histórico se lê rolando,
 * como qualquer lista de evento, e um paginador seria chrome pra um gesto que
 * ninguém faz aqui.
 *
 * `staleTime` curto: ao contrário do vocabulário de tipos, isto muda por conta
 * própria — o reconciliador do servidor emite condição sem ninguém clicar.
 */
export function useNotifications(params: {
  include: NotificationInclude
  audience?: NotificationAudience
  limit?: number
}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list({
      include: params.include,
      audience: params.audience,
    }),
    queryFn: ({ pageParam }) =>
      notificationsService.list({
        include: params.include,
        audience: params.audience,
        limit: params.limit,
        cursor: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 1000 * 10,
  })
}
