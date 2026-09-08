import { Link } from '@tanstack/react-router'
import { useDismissNotification } from '@/hooks/mutations/notifications/use-dismiss-notification'
import { notificationsCopy } from '@/routes/-notifications.copy'
import type { Notification } from '@/services/notifications'
import { NotificationRow } from './notification-row'

/**
 * A lista, os três estados que ela tem, e o esqueleto — compartilhados pelo
 * painel, pela folha do celular e pela rota.
 *
 * Uma peça só porque a linha é a mesma nas três, e a régua de 02/09 já vale:
 * **peça que aparece em três telas para de ser markup e vira componente**;
 * senão a quarta escolhe de novo, e escolhe diferente.
 */

export function NotificationSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-1">
      {Array.from({ length: rows }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: linhas de esqueleto não têm identidade
          key={index}
          className="flex items-start gap-3 px-2 py-3"
        >
          <span className="w-1.5 shrink-0" />
          <span className="aspect-poster w-9 shrink-0 animate-pulse rounded-sm bg-raised" />
          <span className="min-w-0 flex-1 space-y-2 pt-1">
            <span className="block h-3 w-3/4 animate-pulse rounded-sm bg-raised" />
            <span className="block h-3 w-1/2 animate-pulse rounded-sm bg-raised" />
          </span>
        </div>
      ))}
    </div>
  )
}

export function NotificationList({
  notifications,
  surface = 'panel',
}: {
  notifications: Notification[]
  /** `panel` resume; `page` mostra inteiro — ver `NotificationRow`. */
  surface?: 'panel' | 'page'
}) {
  const dismiss = useDismissNotification()

  return (
    <>
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          surface={surface}
          onDismiss={(id) => dismiss.mutate(id)}
        />
      ))}
    </>
  )
}

/**
 * O vazio do PAINEL é um só: ele não tem recorte, então não existe
 * vazio-porque-filtrou (esse é da rota, que tem chips).
 *
 * **A saída não é uma ação primária** — não existe "criar notificação" —, então
 * ele explica o que a tela É. É o que um vazio-porque-não-tem faz quando não há
 * gesto a oferecer.
 */
export function NotificationEmpty({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? 'px-6 py-10 text-center' : 'px-6 py-24 text-center'}
    >
      <p className="font-medium text-ink text-sm">
        {notificationsCopy.empty.title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-muted text-sm">
        {notificationsCopy.empty.body}
      </p>
    </div>
  )
}

export function NotificationEmptyFiltered({ to }: { to: string }) {
  return (
    <div className="px-6 py-24 text-center">
      <p className="font-medium text-ink text-sm">
        {notificationsCopy.emptyFiltered.title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-muted text-sm">
        {notificationsCopy.emptyFiltered.body}
      </p>
      <Link
        to={to}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-line px-4 font-medium text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
      >
        {notificationsCopy.emptyFiltered.action}
      </Link>
    </div>
  )
}

/**
 * O erro do painel não usa a moldura de tela cheia: ela tem `py-24` e texto
 * centrado em `max-w-sm`, feita pra ocupar uma tela, e não cabe em 352px.
 */
export function NotificationError({
  compact = false,
  onRetry,
}: {
  compact?: boolean
  onRetry: () => void
}) {
  const copy = compact ? notificationsCopy.errorShort : notificationsCopy.error

  return (
    <div
      className={compact ? 'px-6 py-10 text-center' : 'px-6 py-24 text-center'}
    >
      <p className="font-medium text-danger text-sm">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-sm text-muted text-sm">{copy.body}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-line px-4 font-medium text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
      >
        {notificationsCopy.error.retry}
      </button>
    </div>
  )
}
