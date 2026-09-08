import type {
  NotificationAudience,
  NotificationInclude,
} from '@/services/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  /**
   * O contador tem chave PRÓPRIA, e não é um campo derivado da lista: ele é
   * pedido em toda tela pelo sino, e a lista só quando o painel abre. Derivá-lo
   * da lista obrigaria a buscar a lista inteira pra desenhar um número.
   */
  unread: () => [...notificationKeys.all, 'unread'] as const,
  list: (params: {
    include: NotificationInclude
    audience?: NotificationAudience
  }) => [...notificationKeys.all, 'list', params] as const,
}
