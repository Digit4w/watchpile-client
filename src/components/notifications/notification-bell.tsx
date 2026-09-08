import { Link } from '@tanstack/react-router'
import { Bell, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useMarkNotificationsRead } from '@/hooks/mutations/notifications/use-mark-notifications-read'
import { useNotifications } from '@/hooks/queries/notifications/use-notifications'
import { useUnreadNotifications } from '@/hooks/queries/notifications/use-unread-notifications'
import { useDelayedPending } from '@/hooks/use-delayed-pending'
import { notificationsCopy } from '@/routes/-notifications.copy'
import type { NotificationSeverity } from '@/services/notifications'
import {
  NotificationEmpty,
  NotificationError,
  NotificationList,
  NotificationSkeleton,
} from './notification-list'

/**
 * O sino — a DESCOBERTA que a decisão de 31/08 já previa sem desenhar.
 *
 * Ele mora colado na conta: no rodapé da sidebar no desktop, ao lado do avatar
 * na barra de cima do celular. A referência (Netflix) o põe numa barra de cima,
 * que o nosso desktop não tem desde 28/08 — então o que se preserva é a
 * adjacência, no lugar onde a periferia já mora.
 *
 * **Isto não reabre a decisão de não haver ponto no `Settings` da sidebar.** O
 * sino É a notificação; o contador da coluna de Settings continua sendo só
 * orientação.
 */

/**
 * O selo, na forma que `SectionBadge` fixou em 01/09: pílula **sólida**,
 * colorida pela pior severidade — o número diz *quanto*, a cor diz *quão grave*.
 *
 * **O degrau neutro é o que aquela não tinha**, e aqui é obrigatório: "o import
 * terminou" não tem gravidade nenhuma, e pintá-lo de `warning` é a régua do
 * sinal virada contra si mesma. Nenhum token novo — os três pares já estavam
 * medidos (16,93 / 9,07 / 6,98).
 */
function UnreadBadge({
  count,
  severity,
}: {
  count: number
  severity: NotificationSeverity | null
}) {
  if (count === 0) {
    return null
  }

  const tone =
    severity === 'danger'
      ? 'bg-danger text-danger-ink'
      : severity === 'warning'
        ? 'bg-warning text-surface'
        : 'bg-ink text-surface'

  return (
    <span
      className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-medium text-[0.625rem] tabular-nums leading-none ${tone}`}
    >
      {count > 9 ? '9+' : count}
      <span className="sr-only">
        {' '}
        {count === 1
          ? notificationsCopy.unread.one
          : notificationsCopy.unread.other}
      </span>
    </span>
  )
}

/**
 * O conteúdo, compartilhado pelo painel do desktop e pela folha do celular.
 *
 * **O painel mostra o RECENTE, não só o não lido** (design system, seção 5): se
 * mostrasse só o não lido, ficaria vazio no instante seguinte ao de olhar.
 */
function Body({ compact }: { compact: boolean }) {
  const query = useNotifications({ include: 'open', limit: 20 })
  const showSkeleton = useDelayedPending(query.isPending)
  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page.notifications) ?? [],
    [query.data],
  )

  if (query.isError) {
    return (
      <NotificationError compact={compact} onRetry={() => query.refetch()} />
    )
  }

  if (query.isPending) {
    return showSkeleton ? <NotificationSkeleton /> : <div className="h-24" />
  }

  if (notifications.length === 0) {
    return <NotificationEmpty compact={compact} />
  }

  return (
    <div
      className={
        compact
          ? 'scrollbar-styled min-h-0 flex-1 overflow-y-auto p-1'
          : 'scrollbar-styled max-h-[26rem] overflow-y-auto p-1'
      }
    >
      <NotificationList notifications={notifications} />
    </div>
  )
}

/**
 * Marca como lido o que o painel MOSTROU, **ao fechar** — nunca durante a
 * leitura (design system, seção 5). Apagar os pontos sob o olho de quem está
 * lendo é "a lista não se reordena sob a mão" aplicada ao rastro.
 *
 * Lê a lista do cache em vez de receber por prop porque quem sabe o que foi
 * mostrado é a consulta, e o gatilho mora aqui fora, no `onOpenChange`.
 */
function useMarkShownOnClose(open: boolean) {
  const query = useNotifications({ include: 'open', limit: 20 })
  const markRead = useMarkNotificationsRead()

  /**
   * Refs, e não dependências do efeito: ele reage **só ao fechar**. Se `shown`
   * fosse dependência, uma notificação chegando com o painel ainda aberto
   * marcaria tudo como lido no mesmo instante — que é exatamente o defeito que
   * esta peça existe pra evitar.
   */
  const shown = useRef<number[]>([])
  shown.current = (
    query.data?.pages.flatMap((page) => page.notifications) ?? []
  )
    .filter((notification) => !notification.read)
    .map((notification) => notification.id)

  const mark = useRef(markRead)
  mark.current = markRead

  const wasOpen = useRef(open)
  useEffect(() => {
    if (wasOpen.current && !open && shown.current.length > 0) {
      mark.current.mutate(shown.current)
    }
    wasOpen.current = open
  }, [open])
}

export function NotificationBell({
  size = 40,
  /**
   * `panel` no desktop, `sheet` no celular. **Quem decide é o CHROME, não uma
   * media query em JS**: o sino é renderizado duas vezes, uma na sidebar (que
   * só existe em `md:`) e outra na barra de cima do celular (que só existe em
   * `max-md:`), e cada instância já sabe onde está.
   */
  surface = 'panel',
  className = '',
}: {
  size?: number
  surface?: 'panel' | 'sheet'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const unread = useUnreadNotifications()
  useMarkShownOnClose(open)

  const trigger = (
    <button
      type="button"
      aria-label={notificationsCopy.bell}
      className={`relative flex shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink ${className}`}
      style={{ width: size, height: size }}
    >
      <Bell className="size-[18px]" strokeWidth={1.6} />
      <UnreadBadge
        count={unread.data?.count ?? 0}
        severity={unread.data?.severity ?? null}
      />
    </button>
  )

  /**
   * **No celular é FOLHA, não popover e não rota.** Um popover de 352px numa
   * tela de 390 é uma tela cheia fantasiada; e a rota pediria um "voltar" que o
   * app não tem em tela nenhuma, além de deixar a barra de abas sem nada aceso.
   *
   * A folha é modal de propósito — é isso que a separa de "uma rota com outro
   * nome": dispensar devolve a tela de onde a pessoa veio, sem entrada no
   * histórico do navegador.
   */
  if (surface === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          aria-label={notificationsCopy.bell}
          onClick={() => setOpen(true)}
          className={`relative flex shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink ${className}`}
          style={{ width: size, height: size }}
        >
          <Bell className="size-[18px]" strokeWidth={1.6} />
          <UnreadBadge
            count={unread.data?.count ?? 0}
            severity={unread.data?.severity ?? null}
          />
        </button>

        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full gap-0 p-0 sm:w-full"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-line border-b px-4">
            <SheetTitle className="font-medium text-base text-ink">
              {notificationsCopy.title}
            </SheetTitle>
            <button
              type="button"
              aria-label={notificationsCopy.close}
              onClick={() => setOpen(false)}
              className="flex size-11 items-center justify-center rounded-md text-faint transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          <Body compact />

          <SeeAll onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        /**
         * 352px, e o número sai da linha e não do gosto: miniatura de 36 + gap
         * 12 + duas linhas de 14px que precisam de ~230px pra não virar quatro
         * + o `×` de 44 + 16 de padding dos dois lados. O `w-64` que a seção 5
         * fixou é do menu de `⋯` — uma lista de AÇÕES —, e esta é uma lista de
         * conteúdo.
         */
        className="w-[22rem] overflow-hidden p-0"
      >
        <div className="flex h-11 items-center border-line/60 border-b px-4">
          <p className="font-medium text-ink text-sm">
            {notificationsCopy.title}
          </p>
        </div>

        <Body compact={false} />

        <SeeAll onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

/**
 * **O rodapé é do PAINEL, não da lista, e por isso não some no vazio.**
 * Dispensar tira do painel e mantém no histórico — então um painel vazio é
 * exatamente o estado em que a rota tem algo que ele não tem. Fazer o `See all`
 * sumir junto trancaria a única porta pro que a pessoa dispensou.
 */
function SeeAll({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="border-line/60 border-t p-1">
      <Link
        to="/notifications"
        onClick={onNavigate}
        className="flex h-9 items-center justify-center rounded-sm font-medium text-muted text-sm transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink"
      >
        {notificationsCopy.seeAll}
      </Link>
    </div>
  )
}
