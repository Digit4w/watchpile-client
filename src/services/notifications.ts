import type { paths } from '@/infra/lib/api-types'
import { httpClient } from '@/infra/lib/http-client'

/**
 * A central de notificações (brief, 3.9).
 *
 * **A resposta não traz frase** — traz `kind` e `params`, e quem monta a copy é
 * `notifications.copy.ts`. Não é divisão arbitrária: a linha é persistida no
 * servidor, então uma frase gravada lá sobreviveria à tradução do app e ficaria
 * em inglês num histórico de dois anos atrás (brief, 3.8).
 */
export type NotificationList =
  paths['/api/notifications']['get']['responses'][200]['content']['application/json']

export type Notification = NotificationList['notifications'][number]

export type NotificationKind = Notification['kind']

export type NotificationUnread =
  paths['/api/notifications/unread-count']['get']['responses'][200]['content']['application/json']

export type NotificationSeverity = NonNullable<NotificationUnread['severity']>

export type NotificationAudience = Notification['audience']

/**
 * `open` é o painel — o que ainda não foi dispensado. `all` é o histórico.
 * São duas superfícies de uma rota só, e é a distinção entre *lido* e
 * *dispensado* que dá endereço próprio ao histórico.
 */
export type NotificationInclude = 'open' | 'all'

export const notificationsService = {
  list: (params: {
    include?: NotificationInclude
    audience?: NotificationAudience
    limit?: number
    cursor?: number
  }) => {
    const query = new URLSearchParams()
    if (params.include) {
      query.set('include', params.include)
    }
    if (params.audience) {
      query.set('audience', params.audience)
    }
    if (params.limit !== undefined) {
      query.set('limit', String(params.limit))
    }
    if (params.cursor !== undefined) {
      query.set('cursor', String(params.cursor))
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return httpClient.get<NotificationList>(`/api/notifications${suffix}`)
  },

  unreadCount: () =>
    httpClient.get<NotificationUnread>('/api/notifications/unread-count'),

  /**
   * Marca por id o que o painel MOSTROU — nunca "tudo". Um marcar-tudo apagaria
   * o rastro de linhas que a pessoa nunca rolou até ver.
   */
  markRead: (ids: number[]) =>
    httpClient.post<NotificationUnread>('/api/notifications/read', { ids }),

  dismiss: (id: number) =>
    httpClient.post<{ message: string }>(
      `/api/notifications/${id}/dismiss`,
      {},
    ),
}
