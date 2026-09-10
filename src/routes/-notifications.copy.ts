import { formatNumber } from '@/lib/format'
import type { Notification, NotificationKind } from '@/services/notifications'
import { importCopy } from './-import.copy'

/**
 * A copy da central de notificações — e **é aqui que ela existe, não no
 * servidor**.
 *
 * O contrato devolve `kind` + `params`; a frase é montada aqui. A divisão não é
 * arbitrária: a linha é PERSISTIDA no servidor, então uma frase gravada lá
 * sobreviveria à tradução do app e ficaria em inglês num histórico de dois anos
 * atrás (brief, 3.8). É a mesma régua que já valeu quatro vezes — *frase escrita
 * no servidor continua sendo copy de tela* (design system, seção 8) —, um degrau
 * adiante, porque aqui a frase não é efêmera.
 *
 * O `kind` é `z.enum` no contrato, então acrescentar um aviso no servidor vira
 * erro de compilação **aqui**, no `Record` abaixo, em vez de uma linha vazia em
 * produção.
 */

type Params = Notification['params']

function text(params: Params, key: string): string {
  const value = params[key]
  return typeof value === 'string' ? value : ''
}

function bytes(params: Params, key: string): number {
  const value = params[key]
  return typeof value === 'number' ? value : 0
}

/**
 * Megabytes por `Intl`, não por concatenação. O número chega como NÚMERO do
 * servidor justamente pra isto — formatar é decisão de quem sabe o idioma de
 * quem lê (brief, 3.8).
 */
function megabytes(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(Math.round(value / (1024 * 1024)))
}

export type NotificationText = {
  title: string
  body: string
  /** O destino que resolve o aviso, quando existe um. */
  action?: { label: string; to: string }
}

/**
 * **A frase nomeia o provedor, não o slug.** Slug é chave — estável em URL,
 * filtro e FK — e por isso não se traduz nem se capitaliza; onde o contrato
 * devolve chave, a tela resolve (design system, seção 8, sexta leva). É por isso
 * que `params` carrega os dois.
 *
 * E nenhuma frase usa artigo interpolado: `a`/`an` depende da primeira letra de
 * um DADO, e em pt-BR o problema vira gênero e número. Frase nominal atravessa
 * os dois idiomas sem concordar com nada (design system, seção 7).
 */
const BUILDERS: Record<NotificationKind, (params: Params) => NotificationText> =
  {
    /**
     * **Nada está quebrado, e a copy não pode soar como se estivesse.** Ela
     * nomeia a versão e oferece o destino — quem decide se atualiza agora é
     * quem hospeda, e a seção é onde a decisão cabe.
     *
     * A versão entra como veio (`v0.4.2`), sem tirar o `v`: é o nome da
     * release, e é o que a pessoa vai reconhecer na página que o botão abre.
     */
    'update-available': (params) => ({
      title: `Watchpile ${text(params, 'version')} is available`,
      body: 'You are running an older version. Updating is up to you.',
      action: { label: 'Open updates', to: '/settings/updates' },
    }),

    'provider-missing-key': (params) => ({
      title: `${text(params, 'provider')} needs an API key`,
      body: 'Searching the media types it serves will not work until you add one.',
      action: { label: 'Open providers', to: '/settings/providers' },
    }),

    /**
     * **Não é defeito, e a copy não pode soar como um** — a instalação funciona
     * e a busca funciona. O que ela diz é o custo real: o limite é compartilhado
     * por todo mundo que roda Watchpile com a chave embutida (brief, 3.10).
     */
    'provider-embedded-key': (params) => ({
      title: `${text(params, 'provider')} is using the bundled key`,
      body: 'Every Watchpile install shares it, so they share its rate limit too. Add your own key to be safe.',
      action: { label: 'Open providers', to: '/settings/providers' },
    }),

    /**
     * Sem `action`, porque não há tela que resolva isto — o teto é
     * `WATCHPILE_ART_CACHE_MB`, uma variável de ambiente. A copy diz o nome
     * dela em vez de oferecer um botão que não existe: **affordance descreve o
     * que existe** (design system, seção 5).
     */
    'art-cache-full': (params) => ({
      title: 'Artwork cache is full',
      body: `Watchpile started dropping the least-used artwork to stay under ${megabytes(
        bytes(params, 'limitBytes'),
      )} MB. Raise WATCHPILE_ART_CACHE_MB to keep more.`,
    }),

    /**
     * **O primeiro aviso de audiência `user` do app**, e o primeiro uso do
     * degrau `info` — os três acima são todos da instalação. Ele existe porque
     * o import roda em segundo plano: quem saiu da tela precisa de um caminho
     * de volta.
     *
     * A segunda frase só aparece quando há o que dizer. Zero problemas não vira
     * "0 rows couldn't be read" — número que só sabe dizer que não há nada é
     * ruído com altura.
     */
    'import-finished': (params) => {
      const failed = bytes(params, 'problemCount')
      return {
        title: `Import from ${sourceName(params)} finished`,
        body: [
          `${formatNumber(bytes(params, 'added'))} added to your library.`,
          failed > 0
            ? `${formatNumber(failed)} rows couldn't be read — open Import to see them.`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
        action: { label: 'Open import', to: '/settings/import' },
      }
    },

    /**
     * **A frase muda com o `reason`, e é aí que a divisão de 02/09 chega na
     * tela**: `source-refused` manda conferir, `source-down` manda esperar. Sem
     * ela, as duas diriam "não deu" e a pessoa refaria o mesmo gesto contra um
     * serviço que ia recusar de novo.
     *
     * A severidade é `warning` nos dois: o import não aconteceu e há o que
     * refazer. O que difere é o que fazer, não o tamanho do fato.
     */
    'import-failed': (params) => ({
      title: `Import from ${sourceName(params)} didn't run`,
      // A frase é do IMPORT, que é quem produz o motivo — o sino só a exibe.
      body: importCopy.failed.why(text(params, 'reason')),
      action: { label: 'Open import', to: '/settings/import' },
    }),
  }

/**
 * **O nome do serviço, nunca o slug** — slug é chave, e chave não se
 * capitaliza nem se traduz (design system, seção 8, sexta leva). `csv` é o
 * nosso próprio formato, e o nome dele é o do produto.
 */
function sourceName(params: Params): string {
  const slug = text(params, 'source')
  return (
    { anilist: 'AniList', mal: 'MyAnimeList', csv: 'Watchpile' }[slug] ?? slug
  )
}

/**
 * O motivo, resolvido em frase.
 *
 * Sem `Record` fechado de propósito: `reason` chega como texto dentro de
 * `params`, não como campo tipado, então o compilador não teria como cobrar um
 * caso novo. O `??` é a resposta honesta para um `kind` de falha que este
 * binário não conhece — pode vir de um servidor mais novo, e uma linha vazia
 * seria pior que uma frase genérica.
 */

export function notificationText(notification: Notification): NotificationText {
  return BUILDERS[notification.kind](notification.params)
}

export const notificationsCopy = {
  title: 'Notifications',
  /** O rótulo acessível do sino. O visual é o glifo mais o selo. */
  bell: 'Notifications',
  unread: {
    one: 'unread notification',
    other: 'unread notifications',
  },
  dismiss: 'Dismiss',
  /** O rodapé do painel — ele leva ao histórico, inclusive ao dispensado. */
  seeAll: 'See all',
  close: 'Close',

  /**
   * O número ao lado do título é o que ainda PEDE algo, não o total (design
   * system, seção 7): o nome da tela já é o substantivo, e "8 notifications"
   * gaguejaria. Some ao chegar a zero.
   */
  unreadCount: (count: number) => `${count} unread`,

  /**
   * O agrupamento por tempo não é controle — não liga nem desliga —, então não
   * gasta chrome. Sem ele, oito datas relativas seguidas não dizem onde o dia
   * de ontem acaba.
   */
  /** As chaves são as de `domain/relative-time.ts` — a regra devolve chave, a tela traduz. */
  groups: {
    today: 'Today',
    week: 'This week',
    earlier: 'Earlier',
  },

  /** O eixo de recorte do histórico. Só existe pra admin — ver a rota. */
  audience: {
    all: 'All',
    user: 'You',
    instance: 'This instance',
  },

  empty: {
    /**
     * A saída não é uma ação primária: não existe "criar notificação". Então
     * ele explica o que a tela É — que é o que um vazio-porque-não-tem faz
     * quando não há gesto a oferecer.
     */
    title: "You're all caught up",
    body: 'New episodes from the titles you follow, and alerts about this server, show up here.',
  },
  emptyFiltered: {
    title: 'Nothing here',
    body: 'No notifications match this filter right now.',
    action: 'Show all',
  },
  error: {
    title: "Can't load notifications",
    body: 'The request failed. Check that Watchpile is running, then try again.',
    retry: 'Try again',
  },
  /** O painel não tem espaço pra moldura de tela inteira. */
  errorShort: {
    title: "Can't reach the server",
    body: 'Check that Watchpile is running.',
  },
}
