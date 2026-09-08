import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { z } from 'zod'
import { AppShell } from '@/components/chrome/app-shell'
import { SessionPending } from '@/components/chrome/session-pending'
import {
  NotificationEmpty,
  NotificationEmptyFiltered,
  NotificationError,
  NotificationList,
  NotificationSkeleton,
} from '@/components/notifications/notification-list'
import { type AgeBucket, ageBucket } from '@/domain/notification-grouping'
import { useLogout } from '@/hooks/mutations/auth/use-logout'
import { useNotifications } from '@/hooks/queries/notifications/use-notifications'
import { useUnreadNotifications } from '@/hooks/queries/notifications/use-unread-notifications'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { useRequireSession } from '@/hooks/use-require-session'
import type {
  Notification,
  NotificationAudience,
} from '@/services/notifications'
import { notificationsCopy } from './-notifications.copy'

/**
 * O histórico inteiro — **dispensados inclusive**, e é isso que lhe dá endereço
 * próprio (design system, seção 5). Se dispensar apagasse a linha, esta rota
 * seria o painel com rolagem.
 *
 * **Ela não entra na nav.** A barra de abas seleciona por hábito e não por
 * inventário (29/08), e notificação não é destino diário: chega-se aqui pelo
 * `See all` do painel. No celular o gesto normal é a folha, e por isso ninguém
 * cai nesta rota por acidente — abri-la por link direto deixa a barra de abas
 * sem nada aceso, que é a decisão em aberto **15**.
 */

const SearchSchema = z.object({
  /** O recorte mora na URL (brief, 3.13) — é ele que sobrevive ao F5. */
  audience: z.enum(['instance', 'user']).optional(),
})

export const Route = createFileRoute('/notifications')({
  validateSearch: SearchSchema,
  component: NotificationsRoute,
})

function NotificationsRoute() {
  const { audience } = Route.useSearch()
  const user = useRequireSession()
  const logout = useLogout()
  const navigate = useNavigate()

  const query = useNotifications({ include: 'all', audience, limit: 50 })
  const unread = useUnreadNotifications()
  const showSkeleton = useDelayedPending(query.isPending)

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data],
  )

  if (!user) {
    return <SessionPending />
  }

  return (
    <AppShell
      username={user.username}
      isAdmin={user.isAdmin}
      screenTitle={notificationsCopy.title}
      onLogOut={() =>
        logout.mutate(undefined, {
          onSuccess: () => navigate({ to: '/login' }),
        })
      }
    >
      <Header
        isAdmin={user.isAdmin}
        active={audience}
        unread={unread.data?.count ?? 0}
      />

      {query.isError ? (
        <div className="pt-6">
          <NotificationError onRetry={() => query.refetch()} />
        </div>
      ) : query.isPending ? (
        showSkeleton ? (
          <div className="-mx-2 pt-4">
            <NotificationSkeleton rows={6} />
          </div>
        ) : null
      ) : notifications.length === 0 ? (
        <div className="pt-6">
          {audience ? (
            <NotificationEmptyFiltered to="/notifications" />
          ) : (
            <NotificationEmpty />
          )}
        </div>
      ) : (
        <>
          <Groups notifications={notifications} />
          {query.hasNextPage ? (
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="mt-2 mb-8 inline-flex h-9 max-w-4xl items-center justify-center self-start rounded-md border border-line px-4 font-medium text-ink text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised disabled:opacity-[var(--opacity-disabled)]"
            >
              Load more
            </button>
          ) : null}
        </>
      )}
    </AppShell>
  )
}

/**
 * Cabeçalho de duas faixas — a de cima é o CONJUNTO, a de baixo é o RECORTE
 * (design system, seção 5, 29/08).
 *
 * **A faixa de baixo só existe pra admin.** Quem não é tem um grupo só de
 * notificação, e uma fileira com um `All` sozinho é chrome que não faz nada —
 * a mesma regra que tirou a fileira de `/piles`.
 */
function Header({
  isAdmin,
  active,
  unread,
}: {
  isAdmin: boolean
  active: NotificationAudience | undefined
  unread: number
}) {
  return (
    <div className="sticky top-[var(--wp-app-bar)] z-20 -mx-4 bg-surface px-4 md:top-0 md:-mx-8 md:px-8">
      {/* No celular a faixa de título some: a barra de cima do app já mostra o
          nome da tela, e repetir gastaria 72 dos ~800px do telefone. */}
      <div className="flex h-18 items-center gap-3 max-md:hidden">
        <h1 className="font-semibold text-ink text-xl tracking-tight">
          {notificationsCopy.title}
        </h1>
        {/* O número é o que ainda PEDE algo, não o total — o nome da tela já é
            o substantivo, e "8 notifications" gaguejaria. Some ao chegar a
            zero (design system, seção 7). */}
        {unread > 0 ? (
          <span className="text-faint text-sm tabular-nums">
            {notificationsCopy.unreadCount(unread)}
          </span>
        ) : null}
      </div>

      {isAdmin ? <AudienceChips active={active} /> : null}
    </div>
  )
}

const CHIPS: { key: NotificationAudience | undefined; label: string }[] = [
  { key: undefined, label: notificationsCopy.audience.all },
  { key: 'user', label: notificationsCopy.audience.user },
  { key: 'instance', label: notificationsCopy.audience.instance },
]

function AudienceChips({
  active,
}: {
  active: NotificationAudience | undefined
}) {
  return (
    <div className="scrollbar-none relative flex h-14 items-center gap-2 overflow-x-auto">
      {CHIPS.map((chip) => {
        const on = chip.key === active
        return (
          <Link
            key={chip.label}
            to="/notifications"
            search={chip.key ? { audience: chip.key } : {}}
            className={`inline-flex h-8 shrink-0 items-center rounded-sm px-3 text-sm transition-colors duration-[var(--motion-micro)] ease-chrome ${
              on
                ? 'bg-ink font-medium text-surface'
                : 'text-muted ring-1 ring-line hover:bg-raised hover:text-ink'
            }`}
          >
            {chip.label}
          </Link>
        )
      })}
    </div>
  )
}

/**
 * Agrupado por tempo. **O agrupamento não é controle** — não liga nem desliga,
 * então não gasta chrome —, e sem ele oito datas relativas seguidas não dizem
 * onde o dia de ontem acaba.
 *
 * A separação usa a mesma normalização de fuso de `relativeTime`, e por isso ela
 * mora no domínio: dois lugares decidindo o que é "hoje" é como um deles fica
 * pra trás.
 */
function Groups({ notifications }: { notifications: Notification[] }) {
  const groups = useMemo(() => groupByAge(notifications), [notifications])

  return (
    <div className="-mx-2 pb-8">
      {groups.map(([label, rows]) => (
        <section key={label}>
          <h2 className="px-2 pt-5 pb-1 font-medium text-faint text-xs uppercase tracking-wide">
            {label}
          </h2>
          <NotificationList notifications={rows} surface="page" />
        </section>
      ))}
    </div>
  )
}

const ORDER: AgeBucket[] = ['today', 'week', 'earlier']

function groupByAge(notifications: Notification[]): [string, Notification[]][] {
  const buckets = new Map<AgeBucket, Notification[]>()
  for (const notification of notifications) {
    const bucket = ageBucket(notification.createdAt)
    const rows = buckets.get(bucket) ?? []
    rows.push(notification)
    buckets.set(bucket, rows)
  }

  return ORDER.flatMap((bucket) => {
    const rows = buckets.get(bucket)
    return rows && rows.length > 0
      ? ([[notificationsCopy.groups[bucket], rows]] as [
          string,
          Notification[],
        ][])
      : []
  })
}
