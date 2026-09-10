import { Link } from '@tanstack/react-router'
import { ArrowUpCircle, Download, Images, KeyRound, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import {
  notificationsCopy,
  notificationText,
} from '@/routes/-notifications.copy'
import type { Notification, NotificationKind } from '@/services/notifications'

/**
 * Uma notificação, na forma que o painel e a rota compartilham.
 *
 * O que muda entre as duas é só onde o carimbo cai — ver `timeAsColumn`.
 */

/**
 * O slot da esquerda diz **sobre o que** é a notificação, e a cor diz **quão
 * grave** (design system, seção 5).
 *
 * O ladrilho é neutro e só o traço se tinge: um bloco sólido de `warning` de
 * 36×54 mentiria sobre o tamanho de um fato que se resolve quando der. E o
 * tingimento a 15% que pareceria o meio-termo está proibido pela seção 9 —
 * fundo tingido não é uma peça suave, é a peça deixando de existir.
 *
 * **Não há caminho de ARTE ainda, e isso é decisão.** Nenhum `kind` de hoje fala
 * de uma obra: update de série depende de reconsultar provedor, que não existe.
 * O slot de arte nasce junto do primeiro `kind` que carregue uma obra —
 * affordance descreve o que existe.
 */
const GLYPHS: Record<NotificationKind, typeof KeyRound> = {
  'provider-missing-key': KeyRound,
  'provider-embedded-key': KeyRound,
  'art-cache-full': Images,
  /**
   * A seta pra baixo do import diz *chegou alguma coisa*; esta diz *há aonde
   * ir*. Reusar `Download` poria a versão nova e o import terminado com o mesmo
   * glifo, e os dois convivem no painel — o que separa dois avisos num mesmo
   * lugar tem que ser o glifo, porque a severidade dos dois é `info`.
   */
  'update-available': ArrowUpCircle,
  /**
   * Os dois do import usam o MESMO glifo, e o que os separa é o tom que o
   * `Slot` já aplica pela severidade — `info` neutro, `warning` tingido. Um
   * glifo de erro no que falhou diria duas vezes a mesma coisa, e diria a
   * segunda mais alto que o fato merece (design system, seção 5).
   */
  'import-finished': Download,
  'import-failed': Download,
}

function Slot({ notification }: { notification: Notification }) {
  const Glyph = GLYPHS[notification.kind]
  const tone =
    notification.severity === 'danger'
      ? 'text-danger'
      : notification.severity === 'warning'
        ? 'text-warning'
        : 'text-faint'

  return (
    <span
      className={`flex aspect-poster w-9 shrink-0 items-center justify-center rounded-sm bg-raised ${tone}`}
      aria-hidden="true"
    >
      <Glyph className="size-4" strokeWidth={1.6} />
    </span>
  )
}

/**
 * O ponto de NÃO LIDO, numa canaleta à esquerda — o gesto do cliente de e-mail,
 * que é a referência que o princípio 3 da seção 1 já nomeia.
 *
 * **O lido não desbota a linha** (design system, seção 5): `muted` e
 * `--opacity-disabled` são o vocabulário de INERTE, e notificação lida não é
 * inerte. Pior, desbotar apagaria a hierarquia entre título e corpo justamente
 * nas linhas antigas, que são a maioria.
 *
 * Tingir a linha também está fora, e por outro motivo: sobre vidro `raised` é
 * tingimento (seção 2), e o hover já usa esse tingimento — os dois disputariam
 * o mesmo sinal.
 */
function UnreadDot({ read }: { read: boolean }) {
  if (read) {
    return <span className="w-1.5 shrink-0" aria-hidden="true" />
  }

  return (
    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink">
      <span className="sr-only">Unread</span>
    </span>
  )
}

export function NotificationRow({
  notification,
  onDismiss,
  surface = 'panel',
}: {
  notification: Notification
  onDismiss: (id: number) => void
  /**
   * **O painel RESUME; a rota mostra INTEIRO** — e é isso que faz o `See all`
   * significar mais que "os mais antigos".
   *
   * Visto na tela: o corpo do aviso do cache de arte cortava em
   * "…to stay under 1 MB. Raise", comendo justamente a metade que diz o que
   * fazer. Não há tela de detalhe de uma notificação, então o que o clamp
   * esconde não tem outro lugar — e a rota é esse lugar.
   *
   * A diferença de carimbo vem junto: na rota há largura pra uma coluna à
   * direita, no painel de 352px não há e ele cai sob o corpo.
   */
  surface?: 'panel' | 'page'
}) {
  const onPage = surface === 'page'
  const copy = notificationText(notification)

  return (
    <div
      className={`group flex items-start gap-3 rounded-md px-2 py-3 transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised ${
        // **Prosa tem medida; coluna de valor não** (design system, seção 4).
        // As listas de `/library` ocupam a largura toda porque alinham valores
        // curtos; duas frases a 14px desmontam passando de ~75 caracteres.
        onPage ? 'max-w-4xl' : ''
      }`}
    >
      <UnreadDot read={notification.read} />
      <Slot notification={notification} />

      <span className="min-w-0 flex-1">
        <span
          className={`block font-medium text-ink text-sm ${onPage ? '' : 'line-clamp-2'}`}
        >
          {copy.title}
        </span>
        <span
          className={`mt-0.5 block text-muted text-sm ${onPage ? '' : 'line-clamp-3'}`}
        >
          {copy.body}
        </span>

        {copy.action ? (
          <Link
            to={copy.action.to}
            className="mt-1.5 inline-flex h-7 items-center rounded-sm px-2 font-medium text-ink text-xs ring-1 ring-line transition-colors duration-[var(--motion-micro)] ease-chrome hover:bg-raised"
          >
            {copy.action.label}
          </Link>
        ) : null}

        {onPage ? null : (
          <p className="mt-1 text-faint text-xs">
            <RelativeTime value={notification.createdAt} />
          </p>
        )}
      </span>

      {onPage ? (
        <span className="hidden w-28 shrink-0 pt-0.5 text-right text-faint text-xs sm:block">
          <RelativeTime value={notification.createdAt} />
        </span>
      ) : null}

      {/**
       * 44px nos DOIS apontadores, e por isso esta tela não herda a decisão em
       * aberto #8: aquela pergunta é sobre DENSIDADE — alvo de 32px numa linha
       * de 36 —, e a linha daqui tem ~80px com três linhas de texto.
       *
       * `opacity` no ponteiro e visível no toque: onde o hover revela, o toque
       * mostra (design system, seção 5), e o gatilho é o apontador e nunca a
       * largura da tela.
       */}
      <button
        type="button"
        aria-label={notificationsCopy.dismiss}
        onClick={() => onDismiss(notification.id)}
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-faint opacity-100 transition-[opacity,color,background-color] duration-[var(--motion-micro)] ease-chrome hover:bg-raised hover:text-ink [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}

/**
 * O carimbo usa `formatRelativeTime` de `lib/format.ts`, que já existia desde
 * `/piles`.
 *
 * A primeira versão trazia um relógio próprio, e o preço apareceu na tela: sem
 * passar pelo `LOCALE` daquele arquivo, o `Intl` seguia o NAVEGADOR e a linha
 * saía "IGDB needs an API key … há 4 minutos" — duas línguas na mesma frase.
 */
function RelativeTime({ value }: { value: string }) {
  return <time dateTime={value}>{formatRelativeTime(value)}</time>
}
